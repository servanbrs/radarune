import "server-only";
import { rbacService, type AppPermission } from "@/features/authorization/server/rbac";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

export function assertAdminPermission(actor: FinanceActorContext, permission: AppPermission) {
  const allowed = rbacService.hasEffectivePermission({
    membershipRole: actor.membershipRole,
    permission,
    systemRole: actor.systemRole,
  });

  if (!allowed) {
    throw new Error("Bu admin işlemi için yetkiniz yok.");
  }
}

export function canAccessAdmin(actor: FinanceActorContext) {
  return rbacService.hasEffectivePermission({
    membershipRole: actor.membershipRole,
    permission: "admin.dashboard.view",
    systemRole: actor.systemRole,
  });
}

export function toAdminActor(input: {
  organizationId: string;
  membershipRole: FinanceActorContext["membershipRole"];
  systemRole: FinanceActorContext["systemRole"];
  userId: string;
}): FinanceActorContext {
  return input;
}
