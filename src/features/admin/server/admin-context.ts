import "server-only";

import {
  rbacService,
  type AppPermission,
} from "@/features/authorization/server/rbac";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

const ADMIN_SYSTEM_ROLES: ReadonlySet<
  FinanceActorContext["systemRole"]
> = new Set(["MODERATOR", "ADMIN", "SUPER_ADMIN"]);

export function canAccessAdmin(
  actor: FinanceActorContext,
): boolean {
  return ADMIN_SYSTEM_ROLES.has(actor.systemRole);
}

export function assertAdminPermission(
  actor: FinanceActorContext,
  permission: AppPermission,
) {
  if (!canAccessAdmin(actor)) {
    throw new Error(
      "Bu alan yalnızca Radarune yönetim ekibine açıktır.",
    );
  }

  const allowed = rbacService.hasSystemPermission(
    actor.systemRole,
    permission,
  );

  if (!allowed) {
    throw new Error(
      "Bu admin işlemi için gerekli sistem yetkiniz bulunmuyor.",
    );
  }
}

export function toAdminActor(input: {
  organizationId: string;
  membershipRole: FinanceActorContext["membershipRole"];
  systemRole: FinanceActorContext["systemRole"];
  userId: string;
}): FinanceActorContext {
  return input;
}