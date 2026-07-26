import { describe, expect, it } from "vitest";
import { passwordPolicySchema } from "@/features/authentication/schemas/password-policy.schema";

describe("password policy", () => {
  it("5 karakterlik parolayı reddeder", () => {
    expect(passwordPolicySchema.safeParse("12345").success).toBe(false);
  });

  it("6 karakterlik parolayı kabul eder", () => {
    expect(passwordPolicySchema.safeParse("123456").success).toBe(true);
  });
});
