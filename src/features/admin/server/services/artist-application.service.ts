import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { artistApplicationRepository } from "@/features/admin/server/repositories/artist-application.repository";
import { notificationService } from "@/features/admin/server/services/notification.service";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import type { ArtistApplicationActionInput } from "@/features/admin/schemas/admin.schema";
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
  async listApplications(actor: FinanceActorContext, params: { page: number; pageSize: number; search?: string }) {
    assertAdminPermission(actor, "artists.review");
    return artistApplicationRepository.list({ ...params, organizationId: actor.organizationId });
  }

  async getApplication(actor: FinanceActorContext, id: string) {
    assertAdminPermission(actor, "artists.review");
    const application = await artistApplicationRepository.findById(id);
    if (!application || application.organizationId !== actor.organizationId) {
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
      if (!application || application.organizationId !== actor.organizationId) {
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
              appleMusicProfileUrl: application.appleMusicArtistUrl,
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
            organizationId: actor.organizationId,
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
            organizationId: actor.organizationId,
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
          organizationId: actor.organizationId,
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
    }

    await auditLogService.create(
      {
        organizationId: actor.organizationId,
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
