import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/features/authentication/lib/safe-redirect";

describe("safeRedirectPath", () => {
  it("allows an internal path and its query string", () => {
    expect(safeRedirectPath("/releases?draft=1")).toBe("/releases?draft=1");
  });

  it("rejects external and protocol-relative destinations", () => {
    expect(safeRedirectPath("https://evil.example/login")).toBe("/dashboard");
    expect(safeRedirectPath("//evil.example/login")).toBe("/dashboard");
  });

  it("uses the dashboard for invalid input", () => {
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath("not-a-path")).toBe("/dashboard");
  });
});

