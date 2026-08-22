import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import type { DatabaseClient } from "@/server/prisma/database-client";
import type { CreateReleaseInput, ReleaseSupplementalUpdateInput, TrackInput, UpdateReleaseInput } from "@/features/releases/schemas/release.schema";
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
      externalMediaSources: {
        orderBy: { updatedAt: "desc" as const },
        take: 1,
      },
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
      organizationId?: string;
      actorUserId?: string;
      reason: string;
      metadata?: Record<string, unknown>;
    },
    client: DatabaseClient = prisma,
  ) {
    const updated = await client.release.updateMany({
      where: {
        id,
        ...(input.organizationId ? { organizationId: input.organizationId } : {}),
        ...(isReleaseStatus(input.previousStatus) ? { status: input.previousStatus } : {}),
      },
      data: {
        status: input.status,
        ...(input.status === "APPROVED" ? { approvedAt: new Date() } : {}),
        ...(input.status === "REJECTED" ? { rejectedAt: new Date() } : {}),
        ...(input.status === "LIVE" ? { liveAt: new Date() } : {}),
      },
    });

    if (updated.count !== 1) {
      throw new Error("Yayın durumu değişti; işlem artık geçerli değil.");
    }

    const organizationId = input.organizationId ?? (await client.release.findUniqueOrThrow({
      where: { id },
      select: { organizationId: true },
    })).organizationId;

    await client.releaseStatusHistory.create({
      data: {
        organizationId,
        releaseId: id,
        previousStatus: isReleaseStatus(input.previousStatus) ? input.previousStatus : null,
        status: input.status,
        actorUserId: input.actorUserId ?? null,
        reason: input.reason,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });

    return { id, status: input.status };
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
        ...(input.videoDistributionEnabled !== undefined ? { videoDistributionEnabled: input.videoDistributionEnabled } : {}),
        ...(input.videoStores !== undefined ? { videoStores: input.videoStores } : {}),
      },
      select: {
        id: true,
      },
    });
  }

  async updateSupplemental(releaseId: string, input: ReleaseSupplementalUpdateInput, client: DatabaseClient = prisma) {
    const release = await client.release.findUnique({ where: { id: releaseId }, select: { id: true } });
    if (!release) throw new Error("Yayın bulunamadı.");

    const trackIds = input.tracks?.map((track) => track.id) ?? [];
    if (new Set(trackIds).size !== trackIds.length) throw new Error("Aynı parça birden fazla kez gönderildi.");
    if (trackIds.length > 0) {
      const ownedTrackCount = await client.track.count({ where: { releaseId, id: { in: trackIds } } });
      if (ownedTrackCount !== trackIds.length) throw new Error("Parça bu yayına ait değil.");
    }

    const updated = await client.release.update({
      where: { id: releaseId },
      data: {
        ...(input.upc !== undefined ? { upc: input.upc ?? null } : {}),
        ...(input.videoDistributionEnabled !== undefined ? { videoDistributionEnabled: input.videoDistributionEnabled } : {}),
        ...(input.videoStores !== undefined ? { videoStores: input.videoStores } : {}),
      },
      select: { id: true, upc: true, videoDistributionEnabled: true, videoStores: true },
    });

    for (const track of input.tracks ?? []) {
      await client.track.update({ where: { id: track.id }, data: { isrc: track.isrc ?? null } });
    }
    return updated;
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
    expectedPreviousStatus: "DRAFT" | "REVISION_REQUESTED";
  }, client: DatabaseClient = prisma) {
    const updated = await client.release.updateMany({
      where: {
        id: params.releaseId,
        organizationId: params.organizationId,
        status: params.expectedPreviousStatus,
      },
      data: {
        status: "PENDING_REVIEW",
        submittedByUserId: params.actorUserId,
        submittedAt: new Date(),
      },
    });

    if (updated.count !== 1) {
      throw new Error("Yayın durumu değişti; lütfen sayfayı yenileyip tekrar deneyin.");
    }

    await client.releaseStatusHistory.create({
      data: {
        organizationId: params.organizationId,
        releaseId: params.releaseId,
        previousStatus: params.expectedPreviousStatus,
        status: "PENDING_REVIEW",
        actorUserId: params.actorUserId,
        reason: "Yayın admin incelemesine gönderildi.",
      },
    });

    return { id: params.releaseId, status: "PENDING_REVIEW" as const };
  }

  async attachUpload(params: {
    releaseId: string;
    organizationId: string;
    trackId?: string;
    uploadId: string;
    kind: "AUDIO" | "ARTWORK" | "VIDEO";
  }, client: DatabaseClient = prisma) {
    const upload = await client.upload.findFirst({
      where: {
        id: params.uploadId,
        organizationId: params.organizationId,
        kind: params.kind,
      },
      select: { id: true },
    });

    if (!upload) {
      throw new Error("Dosya bulunamadı veya bu organizasyona ait değil.");
    }

    if (params.trackId) {
      const track = await client.track.findFirst({
        where: {
          id: params.trackId,
          releaseId: params.releaseId,
          organizationId: params.organizationId,
        },
        select: { id: true },
      });

      if (!track) {
        throw new Error("Parça bu organizasyona ve yayına ait değil.");
      }
    }

    await client.upload.update({
      where: { id: upload.id },
      data: {
        releaseId: params.releaseId,
        trackId: params.trackId ?? null,
        status: "READY",
      },
    });

    if (params.kind === "ARTWORK") {
      const releaseUpdated = await client.release.updateMany({
        where: { id: params.releaseId, organizationId: params.organizationId },
        data: {
          artworkUploadId: params.uploadId,
        },
      });
      if (releaseUpdated.count !== 1) throw new Error("Yayın bu organizasyona ait değil.");
    }

    if (params.kind === "VIDEO") {
      const releaseUpdated = await client.release.updateMany({
        where: { id: params.releaseId, organizationId: params.organizationId },
        data: { videoUploadId: params.uploadId, videoDistributionEnabled: true },
      });
      if (releaseUpdated.count !== 1) throw new Error("Yayın bu organizasyona ait değil.");
    }

    if (params.kind === "AUDIO" && params.trackId) {
      const trackUpdated = await client.track.updateMany({
        where: { id: params.trackId, releaseId: params.releaseId, organizationId: params.organizationId },
        data: {
          audioUploadId: params.uploadId,
        },
      });
      if (trackUpdated.count !== 1) throw new Error("Parça bu organizasyona ve yayına ait değil.");
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
      sourceUrl: input.sourceUrl ?? null,
      previewStartSeconds: input.previewStartSeconds ?? null,
    };
  }
}

export const releaseRepository = new ReleaseRepository();
