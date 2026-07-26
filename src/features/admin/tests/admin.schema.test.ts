import { describe, expect, it } from "vitest";
import {
  artistApplicationActionSchema,
  releaseModerationActionSchema,
  updateUserRoleSchema,
} from "@/features/admin/schemas/admin.schema";

describe("Admin validation schemas", () => {
  it("kritik kullanıcı rol değişikliğinde sebep ister", () => {
    const result = updateUserRoleSchema.safeParse({
      role: "ADMIN",
      reason: "kısa",
    });

    expect(result.success).toBe(false);
  });

  it("revizyon isteğinde en az bir yayın maddesi doğrular", () => {
    const result = releaseModerationActionSchema.safeParse({
      action: "REQUEST_REVISION",
      revisionItems: [],
    });

    expect(result.success).toBe(true);
    expect(result.data?.revisionItems).toHaveLength(0);
  });

  it("sanatçı başvuru aksiyonlarını whitelist ile sınırlar", () => {
    const result = artistApplicationActionSchema.safeParse({
      action: "APPROVE",
      reason: "Profil doğrulandı.",
    });

    expect(result.success).toBe(true);
  });
});
