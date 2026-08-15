import "server-only";

import {
  rbacService,
  type AppPermission,
} from "@/features/authorization/server/rbac";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

const PLATFORM_ADMIN_ROLES: ReadonlySet<
  FinanceActorContext["systemRole"]
> = new Set(["ADMIN", "SUPER_ADMIN"]);

export function canAccessAdmin(
  actor: FinanceActorContext,
): boolean {
  return PLATFORM_ADMIN_ROLES.has(actor.systemRole);
}

const MODERATOR_PATHS = new Set([
  "/admin/releases",
  "/admin/applications",
  "/admin/site-builder/discover",
  "/admin/social/playlists",
  "/admin/analytics",
  "/admin/support",
]);

export function canAccessModeratorPath(actor: FinanceActorContext, pathname: string) {
  if (actor.systemRole !== "MODERATOR") return false;
  return [...MODERATOR_PATHS].some(
    (allowedPath) => pathname === allowedPath || pathname.startsWith(`${allowedPath}/`),
  );
}

export function assertAdminPermission(
  actor: FinanceActorContext,
  permission: AppPermission,
) {
  if (!canAccessAdmin(actor) && !(actor.systemRole === "MODERATOR" && [
    "artists.view", "artists.review", "releases:view", "releases:review", "releases:distribute",
    "distribution:view", "discover:manage", "playlists:view", "playlists:manage",
  ].includes(permission))) {
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
