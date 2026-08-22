import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { artistApplicationRepository } from "@/features/admin/server/repositories/artist-application.repository";
import { notificationService } from "@/features/admin/server/services/notification.service";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { createArtistApplicationSchema, type ArtistApplicationActionInput, type CreateArtistApplicationInput } from "@/features/admin/schemas/admin.schema";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export class ArtistApplicationService {
  private canAccessApplication(
    actor: FinanceActorContext,
    application: NonNullable<Awaited<ReturnType<typeof artistApplicationRepository.findById>>>,
  ) {
    return (
      actor.systemRole === "SUPER_ADMIN" ||
      application.organizationId === actor.organizationId ||
      application.user.memberships.some(
        (membership) => membership.organizationId === actor.organizationId,
      )
    );
  }

  async createApplication(actor: FinanceActorContext, input: CreateArtistApplicationInput) {
    const parsed = createArtistApplicationSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false as const, message: Object.values(parsed.error.flatten().fieldErrors).flat().find(Boolean) ?? "Başvuru bilgileri geçerli değil." };
    }

    const existing = await artistApplicationRepository.findOpenForUser(actor.userId, actor.organizationId);
    if (existing) {
      return { success: false as const, message: "Zaten incelenmekte olan bir sanatçı başvurunuz var.", data: existing };
    }

    const application = await artistApplicationRepository.create({
      organizationId: actor.organizationId,
      userId: actor.userId,
      stageName: parsed.data.stageName,
      legalName: parsed.data.legalName,
      biography: parsed.data.biography,
      ...(parsed.data.spotifyArtistUrl ? { spotifyArtistUrl: parsed.data.spotifyArtistUrl } : {}),
      ...(parsed.data.appleMusicArtistUrl ? { appleMusicArtistUrl: parsed.data.appleMusicArtistUrl } : {}),
      ...(parsed.data.youtubeChannelUrl ? { youtubeChannelUrl: parsed.data.youtubeChannelUrl } : {}),
      ...(parsed.data.documentReference ? { documentReference: parsed.data.documentReference } : {}),
      socialLinks: {
        ...(parsed.data.deezerArtistUrl ? { deezerArtistUrl: parsed.data.deezerArtistUrl } : {}),
        ...(parsed.data.itunesArtistUrl ? { itunesArtistUrl: parsed.data.itunesArtistUrl } : {}),
      },
    });

    await auditLogService.create({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "ARTIST_APPLICATION_CREATED",
      entityType: "ArtistApplication",
      entityId: application.id,
      metadata: { stageName: application.stageName },
    });

    await notificationService.notifyOrganizationAdmins({
      organizationId: actor.organizationId,
      type: "ARTIST_APPLICATION_CREATED",
      title: "Yeni sanatçı başvurusu",
      message: `${application.stageName} için yeni sanatçı başvurusu geldi.`,
      entityType: "ArtistApplication",
      entityId: application.id,
    });

    return { success: true as const, data: application };
  }
  async listApplications(actor: FinanceActorContext, params: { page: number; pageSize: number; search?: string }) {
    assertAdminPermission(actor, "artists.review");
    return artistApplicationRepository.list({
      ...params,
      organizationId: actor.organizationId,
      global: actor.systemRole === "SUPER_ADMIN",
    });
  }

  async getApplication(actor: FinanceActorContext, id: string) {
    assertAdminPermission(actor, "artists.review");
    const application = await artistApplicationRepository.findById(id);
    if (!application || !this.canAccessApplication(actor, application)) {
      return null;
    }
    return application;
  }

  async handleAction(actor: FinanceActorContext, id: string, input: ArtistApplicationActionInput) {
    assertAdminPermission(actor, "artists.review");

    if ((input.action === "REJECT" || input.action === "REQUEST_REVISION") && !input.reason) {
      throw new Error("Red ve revizyon işlemlerinde açıklama zorunludur.");
    }

    return prisma.$transaction(async (tx) => {
      const application = await artistApplicationRepository.findById(id, tx);
      if (!application || !this.canAccessApplication(actor, application)) {
        throw new Error("Sanatçı başvurusu bulunamadı.");
      }

      if (application.status === "APPROVED") {
        throw new Error("Onaylanmış başvuru tekrar işlenemez.");
      }

      if (input.action === "START_REVIEW") {
        if (application.status !== "PENDING") {
          throw new Error("Yalnızca bekleyen başvurular incelemeye alınabilir.");
        }

        return this.transitionApplication(actor, application, "UNDER_REVIEW", input, tx);
      }

      if (input.action === "APPROVE") {
        if (!["PENDING", "UNDER_REVIEW", "REVISION_REQUESTED"].includes(application.status)) {
          throw new Error("Başvuru bu durumda onaylanamaz.");
        }

        if (!input.verificationConfirmed) {
          throw new Error("Onaylamadan önce doğrulama kanıtını manuel olarak kontrol ettiğinizi onaylayın.");
        }

        const socialLinks = application.socialLinks;
        const hasPlatformProof = Boolean(
          application.spotifyArtistUrl ||
          application.appleMusicArtistUrl ||
          application.youtubeChannelUrl ||
          application.documentReference ||
          (typeof socialLinks === "object" && socialLinks !== null &&
            !Array.isArray(socialLinks) &&
            ["deezerArtistUrl", "itunesArtistUrl"].some((key) => {
              const value = (socialLinks as Record<string, unknown>)[key];
              return typeof value === "string" && value.trim().length > 0;
            })),
        );
        if (!hasPlatformProof) {
          throw new Error("Bu başvuru doğrulama kanıtı içermiyor. Kanıt isteyip sonra onaylayın.");
        }

        const artist =
          application.artist ??
          (await tx.artist.create({
            data: {
              organizationId: application.organizationId,
              createdByUserId: actor.userId,
              ownerUserId: application.userId,
              name: application.stageName,
              slug: `${slugify(application.stageName)}-${application.id.slice(0, 6)}`,
              sortName: application.stageName,
              type: "SOLO",
              spotifyProfileUrl: application.spotifyArtistUrl,
              appleMusicProfileUrl: application.appleMusicArtistUrl ?? (typeof application.socialLinks === "object" && application.socialLinks !== null && "itunesArtistUrl" in application.socialLinks ? String((application.socialLinks as Record<string, unknown>).itunesArtistUrl) : null),
              deezerProfileUrl: typeof application.socialLinks === "object" && application.socialLinks !== null && "deezerArtistUrl" in application.socialLinks
                ? String((application.socialLinks as Record<string, unknown>).deezerArtistUrl)
                : null,
            },
          }));

        if (application.user.systemRole === "USER") {
          await tx.user.update({
            where: { id: application.userId },
            data: { systemRole: "ARTIST" },
          });
        }

        const updated = await artistApplicationRepository.updateStatus(
          {
            id,
            organizationId: application.organizationId,
            previousStatus: application.status,
            status: "APPROVED",
            actorUserId: actor.userId,
            reason: input.reason ?? "Sanatçı başvurusu onaylandı.",
            artistId: artist.id,
            ...(input.adminNotes ? { adminNotes: input.adminNotes } : {}),
          },
          tx,
        );

        await notificationService.create(
          {
            organizationId: application.organizationId,
            userId: application.userId,
            type: "ARTIST_APPLICATION_APPROVED",
            title: "Sanatçı başvurunuz onaylandı",
            message: `${application.stageName} sanatçı profiliniz onaylandı.`,
            entityType: "ArtistApplication",
            entityId: id,
          },
          tx,
        );

        await auditLogService.create(
          {
            organizationId: application.organizationId,
            actorUserId: actor.userId,
            action: "ARTIST_APPLICATION_APPROVED",
            entityType: "ArtistApplication",
            entityId: id,
            metadata: { artistId: artist.id },
          },
          tx,
        );

        return updated;
      }

      const nextStatus = input.action === "REJECT" ? "REJECTED" : "REVISION_REQUESTED";
      return this.transitionApplication(actor, application, nextStatus, input, tx);
    });
  }

  private async transitionApplication(
    actor: FinanceActorContext,
    application: NonNullable<Awaited<ReturnType<typeof artistApplicationRepository.findById>>>,
    status: "UNDER_REVIEW" | "REJECTED" | "REVISION_REQUESTED",
    input: ArtistApplicationActionInput,
    tx: Prisma.TransactionClient,
  ) {
    const updated = await artistApplicationRepository.updateStatus(
      {
        id: application.id,
        organizationId: application.organizationId,
        previousStatus: application.status,
        status,
        actorUserId: actor.userId,
        ...(input.reason ? { reason: input.reason } : {}),
        ...(input.adminNotes ? { adminNotes: input.adminNotes } : {}),
      },
      tx,
    );

    if (status !== "UNDER_REVIEW") {
      await notificationService.create(
        {
          organizationId: application.organizationId,
          userId: application.userId,
          type:
            status === "REJECTED"
              ? "ARTIST_APPLICATION_REJECTED"
              : "ARTIST_APPLICATION_REVISION_REQUESTED",
          title:
            status === "REJECTED"
              ? "Sanatçı başvurunuz reddedildi"
              : "Sanatçı başvurunuz için revizyon istendi",
          message: input.reason ?? "Başvurunuz güncellendi.",
          entityType: "ArtistApplication",
          entityId: application.id,
        },
        tx,
      );
    } else {
      await notificationService.create(
        {
          organizationId: application.organizationId,
          userId: application.userId,
          type: "ARTIST_APPLICATION_UNDER_REVIEW",
          title: "Sanatçı başvurunuz incelemede",
          message: "Başvurunuz ekip tarafından incelenmeye alındı.",
          entityType: "ArtistApplication",
          entityId: application.id,
        },
        tx,
      );
    }

    await auditLogService.create(
      {
        organizationId: application.organizationId,
        actorUserId: actor.userId,
        action: `ARTIST_APPLICATION_${status}`,
        entityType: "ArtistApplication",
        entityId: application.id,
        metadata: { reason: input.reason ?? null },
      },
      tx,
    );

    return updated;
  }
}

export const artistApplicationService = new ArtistApplicationService();
