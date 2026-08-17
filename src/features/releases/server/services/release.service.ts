import "server-only";
import { prisma } from "@/server/prisma/prisma";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import {
  createReleaseSchema,
  trackInputSchema,
  updateReleaseSchema,
  type CreateReleaseInput,
  type TrackInput,
  type UpdateReleaseInput,
} from "@/features/releases/schemas/release.schema";
import { releaseAccessService, type ReleaseActor } from "@/features/releases/server/services/release-access.service";
import { releaseRepository } from "@/features/releases/server/repositories/release.repository";
import { releaseValidatorService } from "@/features/releases/server/services/release-validator.service";
import { notificationService } from "@/features/admin/server/services/notification.service";
import { webhookEndpointService } from "@/features/platform/server/services/webhook-endpoint.service";
import { sendTemplatedEmail } from "@/features/email/server/email-settings.service";
import { resolveAndAttachExternalLink } from "@/features/integrations/server/services/external-link-resolution.service";

export class ReleaseService {
  async listReleases(actor: ReleaseActor) {
    return releaseRepository.listForActor({
      organizationId: actor.organizationId,
      userId: actor.userId,
      canViewAll: releaseAccessService.canViewAll(actor),
    });
  }

  async getRelease(actor: ReleaseActor, releaseId: string) {
    const release = await releaseRepository.findDetailById(releaseId);
    if (!release) {
      return null;
    }

    releaseAccessService.assertCanViewRelease(actor, release);
    return release;
  }

  async createDraft(actor: ReleaseActor, input: CreateReleaseInput) {
    await releaseAccessService.assertCanCreateRelease(actor);

    const parsed = createReleaseSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        message: this.firstZodError(parsed.error) ?? "Yayın bilgileri geçerli değil.",
      };
    }

    const release = await releaseRepository.createDraft({
      organizationId: actor.organizationId,
      createdByUserId: actor.userId,
      input: parsed.data,
    });

    await auditLogService.create({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "release.draft.create",
      entityType: "Release",
      entityId: release.id,
      metadata: {
        title: parsed.data.title,
        type: parsed.data.type,
      },
    });

    const releaseMessage = `Yeni yayın alındı: “${parsed.data.title}”. Admin incelemesi bekliyor.`;
    await notificationService.notifyOrganizationAdmins({
      organizationId: actor.organizationId,
      type: "RELEASE_CREATED",
      title: "Yeni yayın geldi",
      message: releaseMessage,
      entityType: "Release",
      entityId: release.id,
    });
    await webhookEndpointService.createDelivery({
      organizationId: actor.organizationId,
      eventType: "release.created",
      payload: {
        type: "release.created",
        releaseId: release.id,
        title: parsed.data.title,
        message: releaseMessage,
        status: "DRAFT",
      },
    });
    const adminRecipients = await prisma.user.findMany({
      where: {
        systemRole: { in: ["MODERATOR", "ADMIN", "SUPER_ADMIN"] },
        accountStatus: "ACTIVE",
        memberships: { some: { organizationId: actor.organizationId } },
      },
      select: { email: true },
    });
    const releaseTitle = parsed.data.title.replace(/[\r\n]+/g, " ").trim();
    const releaseUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://radarune.com"}/release/${release.id}`;
    void Promise.allSettled(
      adminRecipients.map((recipient) =>
        sendTemplatedEmail({
          organizationId: actor.organizationId,
          to: recipient.email,
          template: "release",
          title: releaseTitle,
          url: releaseUrl,
        }),
      ),
    ).then((results) => {
      const failed = results.filter((result) => result.status === "rejected");
      if (failed.length > 0) {
        console.error("[RADARUNE_EMAIL] Yayın bildirimi gönderilemedi:", failed.length);
      }
    });

    return {
      success: true as const,
      data: release,
    };
  }

  async updateDraft(actor: ReleaseActor, releaseId: string, input: UpdateReleaseInput) {
    const release = await releaseRepository.findDetailById(releaseId);
    if (!release) {
      return {
        success: false as const,
        message: "Yayın bulunamadı.",
      };
    }

    releaseAccessService.assertCanEditRelease(actor, release);

    const parsed = updateReleaseSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        message: this.firstZodError(parsed.error) ?? "Yayın bilgileri geçerli değil.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await releaseRepository.updateDraft(releaseId, parsed.data, tx);
      await releaseRepository.replaceReleaseArtists(releaseId, parsed.data.artists, tx);
      await releaseRepository.replaceDistribution(releaseId, parsed.data, tx);

      if (parsed.data.tracks) {
        const incomingTrackIds = parsed.data.tracks.flatMap((track) =>
          track.id ? [track.id] : [],
        );

        if (incomingTrackIds.length > 0) {
          const ownedTrackCount = await tx.track.count({
            where: {
              releaseId,
              id: {
                in: incomingTrackIds,
              },
            },
          });

          if (ownedTrackCount !== incomingTrackIds.length) {
            throw new Error("Yayın içindeki parça kimlikleri geçerli değil.");
          }
        }

        await tx.track.deleteMany({
          where: {
            releaseId,
            ...(incomingTrackIds.length > 0
              ? {
                  id: {
                    notIn: incomingTrackIds,
                  },
                }
              : {}),
          },
        });

        for (const track of parsed.data.tracks) {
          await releaseRepository.upsertTrack(
            {
              organizationId: actor.organizationId,
              releaseId,
              input: track,
            },
            tx,
          );
        }
      }
    });

    const linkWarnings: string[] = [];
    if (parsed.data.tracks) {
      const savedTracks = await prisma.track.findMany({
        where: { organizationId: actor.organizationId, releaseId },
        select: { id: true, trackNumber: true, discNumber: true, sourceUrl: true },
      });

      for (const inputTrack of parsed.data.tracks) {
        const savedTrack = inputTrack.id
          ? savedTracks.find((track) => track.id === inputTrack.id)
          : savedTracks.find(
              (track) =>
                track.trackNumber === inputTrack.trackNumber &&
                track.discNumber === inputTrack.discNumber &&
                track.sourceUrl === (inputTrack.sourceUrl ?? null),
            );

        if (!savedTrack) continue;
        const resolved = await resolveAndAttachExternalLink({
          organizationId: actor.organizationId,
          releaseId,
          trackId: savedTrack.id,
          sourceUrl: inputTrack.sourceUrl,
        });
        if (resolved.warning) {
          linkWarnings.push(`${inputTrack.title}: ${resolved.warning}`);
        }
      }
    }

    return {
      success: true as const,
      data: {
        id: releaseId,
        linkWarnings,
      },
    };
  }

  async upsertTrack(actor: ReleaseActor, releaseId: string, input: TrackInput) {
    const release = await releaseRepository.findDetailById(releaseId);
    if (!release) {
      return {
        success: false as const,
        message: "Yayın bulunamadı.",
      };
    }

    releaseAccessService.assertCanEditRelease(actor, release);

    const parsed = trackInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false as const,
        message: this.firstZodError(parsed.error) ?? "Parça bilgileri geçerli değil.",
      };
    }

    const track = await releaseRepository.upsertTrack({
      organizationId: actor.organizationId,
      releaseId,
      input: parsed.data,
    });

    const linkResult = await resolveAndAttachExternalLink({
      organizationId: actor.organizationId,
      releaseId,
      trackId: track.id,
      sourceUrl: parsed.data.sourceUrl,
    });

    return {
      success: true as const,
      data: {
        ...track,
        linkWarning: linkResult.warning,
      },
    };
  }

  async deleteTrack(actor: ReleaseActor, releaseId: string, trackId: string) {
    const release = await releaseRepository.findDetailById(releaseId);
    if (!release) {
      return {
        success: false as const,
        message: "Yayın bulunamadı.",
      };
    }

    releaseAccessService.assertCanEditRelease(actor, release);
    const belongsToRelease = release.tracks.some((track) => track.id === trackId);
    if (!belongsToRelease) {
      return {
        success: false as const,
        message: "Parça bu yayına ait değil.",
      };
    }

    await releaseRepository.deleteTrack(trackId);

    return {
      success: true as const,
      data: {
        id: trackId,
      },
    };
  }

  async attachUpload(actor: ReleaseActor, releaseId: string, params: {
    uploadId: string;
    kind: "AUDIO" | "ARTWORK" | "VIDEO";
    trackId?: string;
  }) {
    const release = await releaseRepository.findDetailById(releaseId);
    if (!release) {
      return {
        success: false as const,
        message: "Yayın bulunamadı.",
      };
    }

    releaseAccessService.assertCanEditRelease(actor, release);

    if (params.kind === "AUDIO" && (!params.trackId || !release.tracks.some((track) => track.id === params.trackId))) {
      return {
        success: false as const,
        message: "Ses dosyası için geçerli bir parça seçilmelidir.",
      };
    }

    await releaseRepository.attachUpload({
      releaseId,
      organizationId: actor.organizationId,
      uploadId: params.uploadId,
      kind: params.kind,
      ...(params.trackId ? { trackId: params.trackId } : {}),
    });

    return {
      success: true as const,
      data: {
        id: params.uploadId,
      },
    };
  }

  async validateRelease(actor: ReleaseActor, releaseId: string) {
    const release = await releaseRepository.findDetailById(releaseId);
    if (!release) {
      return {
        success: false as const,
        message: "Yayın bulunamadı.",
      };
    }

    releaseAccessService.assertCanEditRelease(actor, release);
    const issues = releaseValidatorService.validateForSubmit({
      type: release.type,
      previouslyReleased: release.previouslyReleased,
      upc: release.upc,
      artworkUploadId: release.artworkUploadId,
      ...(release.uploads.find((upload) => upload.id === release.artworkUploadId)?.status
        ? { artworkUploadStatus: release.uploads.find((upload) => upload.id === release.artworkUploadId)!.status }
        : {}),
      stores: release.stores,
      tracks: release.tracks.map((track) => ({
        id: track.id,
        instrumental: track.instrumental,
        previouslyReleased: track.previouslyReleased,
        isrc: track.isrc,
        audioUploadId: track.audioUploadId,
        ...(track.uploads.find((upload) => upload.id === track.audioUploadId)?.status
          ? { audioUploadStatus: track.uploads.find((upload) => upload.id === track.audioUploadId)!.status }
          : {}),
        contributors: track.contributors.map((item) => ({
          role: item.role,
        })),
      })),
    });

    await releaseRepository.createValidationIssues({
      organizationId: actor.organizationId,
      releaseId,
      issues,
    });

    return {
      success: issues.every((issue) => issue.severity !== "ERROR"),
      data: {
        issues,
      },
      message: issues.length === 0 ? "Yayın doğrulandı." : "Yayında düzeltilmesi gereken alanlar var.",
    };
  }

  async submitForReview(actor: ReleaseActor, releaseId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const release = await releaseRepository.findDetailById(releaseId, tx);
      if (!release) {
        return {
          success: false as const,
          message: "Yayın bulunamadı.",
        };
      }

      releaseAccessService.assertCanEditRelease(actor, release);

      if (!["DRAFT", "REVISION_REQUESTED"].includes(release.status)) {
        return {
          success: false as const,
          message: "Yalnızca taslak veya revizyon istenmiş yayınlar incelemeye gönderilebilir.",
        };
      }

      const issues = releaseValidatorService.validateForSubmit({
        type: release.type,
        previouslyReleased: release.previouslyReleased,
        upc: release.upc,
        artworkUploadId: release.artworkUploadId,
        ...(release.uploads.find((upload) => upload.id === release.artworkUploadId)?.status
          ? { artworkUploadStatus: release.uploads.find((upload) => upload.id === release.artworkUploadId)!.status }
          : {}),
        stores: release.stores,
        tracks: release.tracks.map((track) => ({
          id: track.id,
          instrumental: track.instrumental,
          previouslyReleased: track.previouslyReleased,
          isrc: track.isrc,
          audioUploadId: track.audioUploadId,
          ...(track.uploads.find((upload) => upload.id === track.audioUploadId)?.status
            ? { audioUploadStatus: track.uploads.find((upload) => upload.id === track.audioUploadId)!.status }
            : {}),
          contributors: track.contributors.map((item) => ({
            role: item.role,
          })),
        })),
      });

      await releaseRepository.createValidationIssues({
        organizationId: actor.organizationId,
        releaseId,
        issues,
      }, tx);

      if (issues.some((issue) => issue.severity === "ERROR")) {
        return {
          success: false as const,
          message: "Yayın incelemeye gönderilemedi. Lütfen doğrulama hatalarını düzeltin.",
          data: {
            issues,
          },
        };
      }

      const submitted = await releaseRepository.submitRelease({
      releaseId,
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      expectedPreviousStatus: release.status as "DRAFT" | "REVISION_REQUESTED",
    }, tx);

      await auditLogService.create({
        organizationId: actor.organizationId,
        actorUserId: actor.userId,
        action: "release.submit_for_review",
        entityType: "Release",
        entityId: releaseId,
        metadata: {
          previousStatus: release.status,
          nextStatus: "PENDING_REVIEW",
        },
      }, tx);

      return {
        success: true as const,
        data: submitted,
      };
    });

    if (!result.success) return result;

    const linkWarnings = await this.resolveReleaseLinks(actor, releaseId);
    return {
      success: true as const,
      data: {
        ...result.data,
        linkWarnings,
      },
    };
  }

  private async resolveReleaseLinks(actor: ReleaseActor, releaseId: string) {
    const tracks = await prisma.track.findMany({
      where: { organizationId: actor.organizationId, releaseId },
      select: { id: true, title: true, sourceUrl: true },
      orderBy: [{ discNumber: "asc" }, { trackNumber: "asc" }],
    });

    const warnings: string[] = [];
    for (const track of tracks) {
      const result = await resolveAndAttachExternalLink({
        organizationId: actor.organizationId,
        releaseId,
        trackId: track.id,
        sourceUrl: track.sourceUrl ?? undefined,
      });
      if (result.warning) warnings.push(`${track.title}: ${result.warning}`);
    }
    return warnings;
  }

  private firstZodError(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
    return Object.values(error.flatten().fieldErrors).flat().find(Boolean);
  }
}

export const releaseService = new ReleaseService();
