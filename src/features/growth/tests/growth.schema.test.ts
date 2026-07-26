import { describe, expect, it } from "vitest";
import {
  createSmartLinkSchema,
  globalPlaylistCreateSchema,
  preSaveEmailSubscribeSchema,
} from "@/features/growth/schemas/growth.schema";

describe("Growth schemas", () => {
  it("zararlı URL protokolünü reddeder", () => {
    const result = createSmartLinkSchema.safeParse({
      artistId: "artist_1",
      title: "Yeni yayın",
      slug: "yeni-yayin",
      platforms: [{ platform: "SPOTIFY", url: "javascript:alert(1)", sortOrder: 0 }],
    });

    expect(result.success).toBe(false);
  });

  it("sistem route slug değerlerini reddeder", () => {
    const result = createSmartLinkSchema.safeParse({
      artistId: "artist_1",
      title: "Admin linki",
      slug: "admin",
      platforms: [],
    });

    expect(result.success).toBe(false);
  });

  it("pre-save e-posta kaydında açık rıza ister", () => {
    const result = preSaveEmailSubscribeSchema.safeParse({
      email: "fan@example.com",
      marketingConsent: false,
    });

    expect(result.success).toBe(false);
  });

  it("global playlist oylamasında geçmiş bitiş tarihini reddeder", () => {
    const result = globalPlaylistCreateSchema.safeParse({
      name: "Global Picks",
      slug: "global-picks",
      voteEndsAt: new Date(Date.now() - 60_000),
    });

    expect(result.success).toBe(false);
  });

  it("global playlist için gelecekteki oylama tarihini kabul eder", () => {
    const result = globalPlaylistCreateSchema.safeParse({
      name: "Global Picks",
      slug: "global-picks",
      voteEndsAt: new Date(Date.now() + 86_400_000),
    });

    expect(result.success).toBe(true);
  });
});
