import { describe, expect, it } from "vitest";
import { releaseIdTokenFromSlug, releasePublicPath, releaseSlug } from "@/features/releases/lib/release-url";

describe("release public URLs", () => {
  it("creates a readable Turkish slug with a short stable identifier", () => {
    expect(releaseSlug("Her Şeye Rağmen", "cms3ygflt0001pehzb1m6xkm9")).toBe("her-seye-ragmen-cms3ygfl");
    expect(releasePublicPath("Her Şeye Rağmen", "cms3ygflt0001pehzb1m6xkm9")).toBe("/release/her-seye-ragmen-cms3ygfl");
  });

  it("recovers the short identifier from a public slug", () => {
    expect(releaseIdTokenFromSlug("her-seye-ragmen-cms3ygfl")).toBe("cms3ygfl");
    expect(releaseIdTokenFromSlug("invalid-slug")).toBeNull();
  });
});
