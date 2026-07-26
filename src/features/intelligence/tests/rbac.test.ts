import { describe, expect, it } from "vitest";
import { rbacService } from "@/features/authorization/server/rbac";

describe("intelligence RBAC", () => {
  it("MODERATOR provider credential yönetemez", () => {
    expect(
      rbacService.hasEffectivePermission({
        membershipRole: "MEMBER",
        systemRole: "MODERATOR",
        permission: "admin.intelligence.credentials.manage",
      }),
    ).toBe(false);
  });

  it("SUPER_ADMIN intelligence credential yönetebilir", () => {
    expect(
      rbacService.hasEffectivePermission({
        membershipRole: "MEMBER",
        systemRole: "SUPER_ADMIN",
        permission: "admin.intelligence.credentials.manage",
      }),
    ).toBe(true);
  });

  it("MODERATOR kullanıcı silemez, platform ADMIN silebilir", () => {
    expect(
      rbacService.hasEffectivePermission({
        membershipRole: "MEMBER",
        systemRole: "MODERATOR",
        permission: "users.delete",
      }),
    ).toBe(false);
    expect(
      rbacService.hasEffectivePermission({
        membershipRole: "MEMBER",
        systemRole: "ADMIN",
        permission: "users.delete",
      }),
    ).toBe(true);
  });
});
