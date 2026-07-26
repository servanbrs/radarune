import { describe, expect, it } from "vitest";
import { updateUsernameSchema } from "@/features/users/schemas/username.schema";

describe("username schema", () => {
  it("case-insensitive ve Türkçe karakterleri normalize eder", () => {
    expect(updateUsernameSchema.parse({ username: "Çağrı.Müzik" }).username).toBe("cagri.muzik");
  });

  it("reserved kullanıcı adını reddeder", () => {
    expect(updateUsernameSchema.safeParse({ username: "admin" }).success).toBe(false);
  });

  it("ardışık özel karakterleri reddeder", () => {
    expect(updateUsernameSchema.safeParse({ username: "artist..team" }).success).toBe(false);
  });
});
