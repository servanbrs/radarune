import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import type { DatabaseClient } from "@/server/prisma/database-client";
import type { CreateReleaseInput, TrackInput, UpdateReleaseInput } from "@/features/releases/schemas/release.schema";
import type { ReleaseValidationIssueInput } from "@/features/releases/server/services/release-validator.service";

const releaseStatuses = new Set([
  "DRAFT",
  "PENDING_REVIEW",
  "REVISION_REQUESTED",
  "APPROVED",
  "REJECTED",
  "QUEUED",
  "PROCESSING",
  "DISTRIBUTED",
  "LIVE",
  "TAKEDOWN_REQUESTED",
  "REMOVED",
] as const);

type ReleaseStatusLiteral = (typeof releaseStatuses extends Set<infer T> ? T : never);

function isReleaseStatus(value: string | undefined): value is ReleaseStatusLiteral {
  return Boolean(value && releaseStatuses.has(value as ReleaseStatusLiteral));
}

const releaseListSelect = {
  id: true,
  title: true,
  versionTitle: true,
  type: true,
  status: true,
  upc: true,
  plannedReleaseDate: true,
  updatedAt: true,
  createdAt: true,
  createdByUserId: true,
  label: {
    select: {
      id: true,
      name: true,
    },
  },
  artists: {
    orderBy: {
      sortOrder: "asc" as const,
    },
    select: {
      role: true,
      artist: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  _count: {
    select: {
      tracks: true,
      validationIssues: true,
    },
  },
} satisfies Prisma.ReleaseSelect;

const releaseDetailInclude = {
  label: true,
  artists: {
    orderBy: {
      sortOrder: "asc" as const,
    },
    include: {
      artist: true,
    },
  },
  contributors: {
    orderBy: {
      createdAt: "asc" as const,
    },
  },
  distributionSelection: true,
  stores: true,
  territories: true,
  tracks: {
    orderBy: [{ discNumber: "asc" as const }, { trackNumber: "asc" as const }],
    include: {
      artists: {
        orderBy: {
          sortOrder: "asc" as const,
        },
        include: {
          artist: true,
        },
      },
      contributors: {
        include: {
          contributor: true,
        },
      },
      uploads: true,
      validationIssues: {
        where: {
          resolvedAt: null,
        },
      },
    },
  },
  uploads: true,
  validationIssues: {
    where: {
      resolvedAt: null,
    },
    orderBy: {
      createdAt: "desc" as const,
    },
  },
  statusHistory: {
    orderBy: {
      createdAt: "desc" as const,
    },
    take: 20,
  },
} satisfies Prisma.ReleaseInclude;

export class ReleaseRepository {
  async listForActor(params: { organizationId: string; userId: string; canViewAll: boolean }) {
    return prisma.release.findMany({
      where: {
        organizationId: params.organizationId,
        ...(params.canViewAll ? {} : { createdByUserId: params.userId }),
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: releaseListSelect,
    });
  }

  async findDetailById(id: string, client: DatabaseClient = prisma) {
    return client.release.findUnique({
      where: {
        id,
      },
      include: releaseDetailInclude,
    });
  }

  async updateStatus(
    id: string,
    input: {
      status:
        | "DRAFT"
        | "PENDING_REVIEW"
        | "REVISION_REQUESTED"
        | "APPROVED"
        | "REJECTED"
        | "QUEUED"
        | "PROCESSING"
        | "DISTRIBUTED"
        | "LIVE"
        | "TAKEDOWN_REQUESTED"
        | "REMOVED";
      previousStatus?: string;
      actorUserId?: string;
      reason: string;
      metadata?: Record<string, unknown>;
    },
    client: DatabaseClient = prisma,
  ) {
    return client.release.update({
      where: {
        id,
      },
      data: {
        status: input.status,
        ...(input.status === "APPROVED" ? { approvedAt: new Date() } : {}),
        ...(input.status === "REJECTED" ? { rejectedAt: new Date() } : {}),
        ...(input.status === "LIVE" ? { liveAt: new Date() } : {}),
        statusHistory: {
          create: {
            organizationId: (await client.release.findUniqueOrThrow({
              where: { id },
              select: { organizationId: true },
            })).organizationId,
            previousStatus: isReleaseStatus(input.previousStatus)
              ? input.previousStatus
              : null,
            status: input.status,
            actorUserId: input.actorUserId ?? null,
            reason: input.reason,
            metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
          },
        },
      },
      select: {
        id: true,
        status: true,
      },
    });
  }

  async createDraft(params: {
    organizationId: string;
    createdByUserId: string;
    input: CreateReleaseInput;
  }) {
    return prisma.release.create({
      data: {
        organizationId: params.organizationId,
        createdByUserId: params.createdByUserId,
        title: params.input.title,
        versionTitle: params.input.versionTitle ?? null,
        primaryLanguage: params.input.primaryLanguage,
        primaryGenre: params.input.primaryGenre,
        type: params.input.type,
        explicit: params.input.explicit,
        labelId: params.input.labelId ?? null,
        copyrightP: params.input.copyrightP,
        copyrightC: params.input.copyrightC,
        statusHistory: {
          create: {
            organizationId: params.organizationId,
            status: "DRAFT",
            actorUserId: params.createdByUserId,
            reason: "Taslak oluşturuldu.",
          },
        },
      },
      select: {
        id: true,
      },
    });
  }

  async updateDraft(releaseId: string, input: UpdateReleaseInput, client: DatabaseClient = prisma) {
    return client.release.update({
      where: {
        id: releaseId,
      },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.versionTitle !== undefined ? { versionTitle: input.versionTitle ?? null } : {}),
        ...(input.primaryLanguage !== undefined ? { primaryLanguage: input.primaryLanguage } : {}),
        ...(input.primaryGenre !== undefined ? { primaryGenre: input.primaryGenre } : {}),
        ...(input.secondaryGenre !== undefined ? { secondaryGenre: input.secondaryGenre ?? null } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.explicit !== undefined ? { explicit: input.explicit } : {}),
        ...(input.labelId !== undefined ? { labelId: input.labelId ?? null } : {}),
        ...(input.copyrightP !== undefined ? { copyrightP: input.copyrightP } : {}),
        ...(input.copyrightC !== undefined ? { copyrightC: input.copyrightC } : {}),
        ...(input.plannedReleaseDate !== undefined ? { plannedReleaseDate: input.plannedReleaseDate ?? null } : {}),
        ...(input.originalReleaseDate !== undefined ? { originalReleaseDate: input.originalReleaseDate ?? null } : {}),
        ...(input.previouslyReleased !== undefined ? { previouslyReleased: input.previouslyReleased } : {}),
        ...(input.upc !== undefined ? { upc: input.upc ?? null } : {}),
        ...(input.worldwideDistribution !== undefined ? { worldwideDistribution: input.worldwideDistribution } : {}),
        ...(input.presaveEnabled !== undefined ? { presaveEnabled: input.presaveEnabled } : {}),
        ...(input.dolbyAtmosEnabled !== undefined ? { dolbyAtmosEnabled: input.dolbyAtmosEnabled } : {}),
        ...(input.contentIdEnabled !== undefined ? { contentIdEnabled: input.contentIdEnabled } : {}),
      },
      select: {
        id: true,
      },
    });
  }

  async replaceReleaseArtists(releaseId: string, artists: UpdateReleaseInput["artists"], client: DatabaseClient = prisma) {
    if (!artists) {
      return;
    }

    await client.releaseArtist.deleteMany({ where: { releaseId } });
    await client.releaseArtist.createMany({
      data: artists.map((artist) => ({
        releaseId,
        artistId: artist.artistId,
        role: artist.role,
        sortOrder: artist.sortOrder,
      })),
    });
  }

  async replaceDistribution(releaseId: string, input: UpdateReleaseInput, client: DatabaseClient = prisma) {
    if (input.stores) {
      await client.releaseStore.deleteMany({ where: { releaseId } });
      await client.releaseStore.createMany({
        data: input.stores.map((storeCode) => ({ releaseId, storeCode })),
      });
    }

    if (input.territories) {
      await client.releaseTerritory.deleteMany({ where: { releaseId } });
      await client.releaseTerritory.createMany({
        data: input.territories.map((territoryCode) => ({ releaseId, territoryCode })),
      });
    }
  }

  async upsertTrack(params: {
    organizationId: string;
    releaseId: string;
    input: TrackInput;
  }, client: DatabaseClient = prisma) {
    const track = params.input.id
      ? await client.track.update({
          where: {
            id: params.input.id,
          },
          data: this.toTrackData(params.input),
          select: {
            id: true,
          },
        })
      : await client.track.create({
          data: {
            organizationId: params.organizationId,
            releaseId: params.releaseId,
            ...this.toTrackData(params.input),
          },
          select: {
            id: true,
          },
        });

    await client.trackArtist.deleteMany({ where: { trackId: track.id } });
    await client.trackArtist.createMany({
      data: params.input.artists.map((artist) => ({
        trackId: track.id,
        artistId: artist.artistId,
        role: artist.role,
        sortOrder: artist.sortOrder,
      })),
    });

    const existingContributorLinks = await client.trackContributor.findMany({
      where: {
        trackId: track.id,
      },
      select: {
        contributorId: true,
      },
    });

    await client.trackContributor.deleteMany({
      where: {
        trackId: track.id,
      },
    });

    if (existingContributorLinks.length > 0) {
      await client.contributor.deleteMany({
        where: {
          id: {
            in: existingContributorLinks.map((item) => item.contributorId),
          },
          tracks: {
            none: {},
          },
        },
      });
    }

    for (const contributorInput of params.input.contributors) {
      const contributor = await client.contributor.create({
        data: {
          releaseId: params.releaseId,
          name: contributorInput.name,
          role: contributorInput.role,
        },
        select: {
          id: true,
        },
      });

      await client.trackContributor.create({
        data: {
          trackId: track.id,
          contributorId: contributor.id,
          role: contributorInput.role,
        },
      });
    }

    return track;
  }

  async deleteTrack(trackId: string, client: DatabaseClient = prisma) {
    return client.track.delete({
      where: {
        id: trackId,
      },
      select: {
        id: true,
      },
    });
  }

  async createValidationIssues(params: {
    organizationId: string;
    releaseId: string;
    issues: ReleaseValidationIssueInput[];
  }, client: DatabaseClient = prisma) {
    await client.releaseValidationIssue.deleteMany({
      where: {
        releaseId: params.releaseId,
        resolvedAt: null,
      },
    });

    if (params.issues.length === 0) {
      return;
    }

    await client.releaseValidationIssue.createMany({
      data: params.issues.map((issue) => ({
        organizationId: params.organizationId,
        releaseId: params.releaseId,
        trackId: issue.trackId ?? null,
        fieldPath: issue.fieldPath,
        step: issue.step,
        code: issue.code,
        message: issue.message,
        severity: issue.severity,
      })),
    });
  }

  async submitRelease(params: {
    releaseId: string;
    organizationId: string;
    actorUserId: string;
  }, client: DatabaseClient = prisma) {
    return client.release.update({
      where: {
        id: params.releaseId,
      },
      data: {
        status: "PENDING_REVIEW",
        submittedByUserId: params.actorUserId,
        submittedAt: new Date(),
        statusHistory: {
          create: {
            organizationId: params.organizationId,
            previousStatus: "DRAFT",
            status: "PENDING_REVIEW",
            actorUserId: params.actorUserId,
            reason: "Yayın admin incelemesine gönderildi.",
          },
        },
      },
      select: {
        id: true,
        status: true,
      },
    });
  }

  async attachUpload(params: {
    releaseId: string;
    trackId?: string;
    uploadId: string;
    kind: "AUDIO" | "ARTWORK";
  }, client: DatabaseClient = prisma) {
    await client.upload.update({
      where: {
        id: params.uploadId,
      },
      data: {
        releaseId: params.releaseId,
        trackId: params.trackId ?? null,
        status: "READY",
      },
    });

    if (params.kind === "ARTWORK") {
      await client.release.update({
        where: {
          id: params.releaseId,
        },
        data: {
          artworkUploadId: params.uploadId,
        },
      });
    }

    if (params.kind === "AUDIO" && params.trackId) {
      await client.track.update({
        where: {
          id: params.trackId,
        },
        data: {
          audioUploadId: params.uploadId,
        },
      });
    }
  }

  private toTrackData(input: TrackInput) {
    return {
      title: input.title,
      versionTitle: input.versionTitle ?? null,
      trackNumber: input.trackNumber,
      discNumber: input.discNumber,
      language: input.language,
      explicit: input.explicit,
      instrumental: input.instrumental,
      previouslyReleased: input.previouslyReleased,
      isrc: input.isrc ?? null,
      durationMs: input.durationMs ?? null,
      lyrics: input.lyrics ?? null,
      previewStartSeconds: input.previewStartSeconds ?? null,
    };
  }
}

export const releaseRepository = new ReleaseRepository();
