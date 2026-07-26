import "server-only";
import { prisma } from "@/server/prisma/prisma";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { adminUserRepository } from "@/features/admin/server/repositories/admin-user.repository";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import type { UpdateUserRoleInput, UpdateUserStatusInput } from "@/features/admin/schemas/admin.schema";

const privilegedRoles = new Set(["ADMIN", "SUPER_ADMIN"]);

export class AdminUserService {
  async listUsers(actor: FinanceActorContext, params: { page: number; pageSize: number; search?: string }) {
    assertAdminPermission(actor, "users.view");
    return adminUserRepository.list(params);
  }

  async getUser(actor: FinanceActorContext, userId: string) {
    assertAdminPermission(actor, "users.view");
    return adminUserRepository.findById(userId);
  }

  async updateRole(actor: FinanceActorContext, userId: string, input: UpdateUserRoleInput) {
    assertAdminPermission(actor, "users.manage");

    if (actor.userId === userId) {
      throw new Error("Kendi rolünüzü değiştiremezsiniz.");
    }

    return prisma.$transaction(async (tx) => {
      const target = await adminUserRepository.findById(userId, tx);
      if (!target) {
        throw new Error("Kullanıcı bulunamadı.");
      }

      if (actor.systemRole === "ADMIN" && privilegedRoles.has(target.systemRole)) {
        throw new Error("ADMIN başka bir ADMIN veya SUPER_ADMIN rolünü değiştiremez.");
      }

      if (input.role === "SUPER_ADMIN" && actor.systemRole !== "SUPER_ADMIN") {
        throw new Error("SUPER_ADMIN rolünü yalnızca SUPER_ADMIN atayabilir.");
      }

      const updated = await adminUserRepository.updateRole(userId, input.role, tx);
      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: "USER_ROLE_CHANGED",
          entityType: "User",
          entityId: userId,
          metadata: {
            previousRole: target.systemRole,
            newRole: input.role,
            reason: input.reason,
          },
        },
        tx,
      );

      return updated;
    });
  }

  async updateStatus(actor: FinanceActorContext, userId: string, input: UpdateUserStatusInput) {
    assertAdminPermission(actor, "users.manage");

    if (actor.userId === userId) {
      throw new Error("Kendi durumunuzu değiştiremezsiniz.");
    }

    return prisma.$transaction(async (tx) => {
      const target = await adminUserRepository.findById(userId, tx);
      if (!target) {
        throw new Error("Kullanıcı bulunamadı.");
      }

      if (target.systemRole === "SUPER_ADMIN" && input.status !== "ACTIVE") {
        const activeSuperAdmins = await adminUserRepository.countActiveSuperAdmins(tx);
        if (activeSuperAdmins <= 1) {
          throw new Error("Son aktif SUPER_ADMIN pasif hale getirilemez.");
        }
      }

      const updated = await adminUserRepository.updateStatus(userId, input.status, tx);
      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: "USER_STATUS_CHANGED",
          entityType: "User",
          entityId: userId,
          metadata: {
            previousStatus: target.accountStatus,
            newStatus: input.status,
            reason: input.reason,
          },
        },
        tx,
      );

      return updated;
    });
  }
}

export const adminUserService = new AdminUserService();
