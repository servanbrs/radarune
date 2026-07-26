import "server-only";
import { userDeletionAdminActionSchema, userDeletionRequestSchema } from "@/features/users/schemas/user-deletion.schema";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { prisma } from "@/server/prisma/prisma";

const openStatuses = ["REQUESTED", "IN_REVIEW", "APPROVED"] as const;

export class UserDeletionService {
  async request(userId: string, organizationId: string, input: unknown) {
    const parsed = userDeletionRequestSchema.parse(input);
    return prisma.$transaction(async (client) => {
      const existing = await client.userDeletionRequest.findFirst({
        where: { userId, organizationId, status: { in: [...openStatuses] } },
        select: { id: true, status: true },
      });
      if (existing) throw new Error("Bu kullanıcı için zaten açık bir silme talebi var.");

      const request = await client.userDeletionRequest.create({
        data: { organizationId, userId, requestedById: userId, reason: parsed.reason },
        select: { id: true, status: true, requestedAt: true },
      });
      await auditLogService.create({
        organizationId,
        actorUserId: userId,
        action: "USER_DELETION_REQUESTED",
        entityType: "User",
        entityId: userId,
        metadata: { requestId: request.id },
      }, client);
      return request;
    });
  }

  async list(actor: FinanceActorContext) {
    assertAdminPermission(actor, "users.deletion_requests.view");
    return prisma.userDeletionRequest.findMany({
      where: { organizationId: actor.organizationId },
      orderBy: { requestedAt: "desc" },
      select: {
        id: true,
        status: true,
        reason: true,
        reviewNote: true,
        requestedAt: true,
        reviewedAt: true,
        completedAt: true,
        user: { select: { id: true, name: true, email: true, accountStatus: true, systemRole: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });
  }

  async act(actor: FinanceActorContext, requestId: string, input: unknown) {
    const parsed = userDeletionAdminActionSchema.parse(input);
    if (parsed.action === "ANONYMIZE") {
      return this.anonymize(actor, requestId, parsed.note);
    }

    assertAdminPermission(actor, "users.deletion_requests.view");
    return prisma.$transaction(async (client) => {
      const request = await client.userDeletionRequest.findFirst({ where: { id: requestId, organizationId: actor.organizationId } });
      if (!request) throw new Error("Silme talebi bulunamadı.");
      if (request.status === "COMPLETED" || request.status === "CANCELLED") throw new Error("Bu silme talebi artık işlenemez.");
      const status = parsed.action === "REVIEW" ? "IN_REVIEW" : "REJECTED";
      const updated = await client.userDeletionRequest.update({
        where: { id: request.id },
        data: { status, reviewNote: parsed.note ?? null, reviewedById: actor.userId, reviewedAt: new Date() },
        select: { id: true, status: true, reviewedAt: true },
      });
      await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: `USER_DELETION_${status}`, entityType: "UserDeletionRequest", entityId: request.id, metadata: { note: parsed.note ?? null } }, client);
      return updated;
    });
  }

  private async anonymize(actor: FinanceActorContext, requestId: string, note?: string) {
    if (actor.systemRole !== "ADMIN" && actor.systemRole !== "SUPER_ADMIN") {
      throw new Error("Kullanıcı anonimleştirme yalnızca platform yöneticileri tarafından yapılabilir.");
    }
    assertAdminPermission(actor, "users.delete");
    return prisma.$transaction(async (client) => {
      const request = await client.userDeletionRequest.findFirst({ where: { id: requestId, organizationId: actor.organizationId }, include: { user: { select: { id: true, email: true, systemRole: true, accountStatus: true } } } });
      if (!request) throw new Error("Silme talebi bulunamadı.");
      if (request.user.id === actor.userId) throw new Error("Yönetici kendi hesabını bu akıştan silemez.");
      if (![...openStatuses].includes(request.status as (typeof openStatuses)[number])) throw new Error("Bu silme talebi anonimleştirme için uygun değil.");

      if (request.user.systemRole === "SUPER_ADMIN") {
        const activeSuperAdmins = await client.user.count({ where: { systemRole: "SUPER_ADMIN", accountStatus: "ACTIVE" } });
        if (activeSuperAdmins <= 1) throw new Error("Son aktif SUPER_ADMIN anonimleştirilemez.");
      }

      await client.user.update({
        where: { id: request.user.id },
        data: { name: "Silinmiş Kullanıcı", email: `deleted-${request.user.id}@deleted.invalid`, username: null, image: null, emailVerified: false, accountStatus: "BANNED" },
      });
      await client.session.deleteMany({ where: { userId: request.user.id } });
      const updated = await client.userDeletionRequest.update({ where: { id: request.id }, data: { status: "COMPLETED", reviewNote: note ?? request.reviewNote, reviewedById: actor.userId, reviewedAt: new Date(), completedAt: new Date() }, select: { id: true, status: true, completedAt: true } });
      await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "USER_ANONYMIZED", entityType: "User", entityId: request.user.id, metadata: { requestId: request.id } }, client);
      return updated;
    });
  }
}

export const userDeletionService = new UserDeletionService();
