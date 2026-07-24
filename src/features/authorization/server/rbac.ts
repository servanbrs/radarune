import "server-only";
import { redirect } from "next/navigation";

export type AppPermission =
  | "organization:view"
  | "organization:update"
  | "organization:members:view"
  | "organization:members:manage"
  | "label:view"
  | "label:create"
  | "label:update"
  | "label:delete"
  | "artist:view"
  | "artist:create"
  | "artist:update"
  | "artist:delete"
  | "distribution:view"
  | "distribution:manage";

export type MembershipRole = "OWNER" | "ADMIN" | "MEMBER";

const rolePermissions: Record<MembershipRole, readonly AppPermission[]> = {
  OWNER: [
    "organization:view",
    "organization:update",
    "organization:members:view",
    "organization:members:manage",
    "label:view",
    "label:create",
    "label:update",
    "label:delete",
    "artist:view",
    "artist:create",
    "artist:update",
    "artist:delete",
    "distribution:view",
    "distribution:manage",
  ],
  ADMIN: [
    "organization:view",
    "organization:members:view",
    "label:view",
    "label:create",
    "label:update",
    "artist:view",
    "artist:create",
    "artist:update",
    "distribution:view",
  ],
  MEMBER: [
    "organization:view",
    "label:view",
    "artist:view",
    "distribution:view",
  ],
};

class RbacService {
  hasPermission(role: MembershipRole, permission: AppPermission) {
    return rolePermissions[role].includes(permission);
  }

  assertPermission(role: MembershipRole, permission: AppPermission) {
    if (!this.hasPermission(role, permission)) {
      throw new Error("You do not have permission to perform this action.");
    }
  }

  redirectIfMissingPermission(role: MembershipRole, permission: AppPermission) {
    if (!this.hasPermission(role, permission)) {
      redirect("/dashboard");
    }
  }

  listPermissions(role: MembershipRole) {
    return rolePermissions[role];
  }
}

export const rbacService = new RbacService();
