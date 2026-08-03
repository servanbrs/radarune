import { describe, expect, it } from "vitest";
import { validateSitemapEntries } from "@/features/seo/server/sitemap-validation.service";

describe("sitemap validation", () => {
  it("accepts unique public HTTPS URLs", () => {
    const result = validateSitemapEntries([
      { url: "https://radarune.com/" },
      { url: "https://radarune.com/artist/ati242", lastModified: new Date() },
    ]);

    expect(result).toEqual({ valid: true, errors: [], duplicateCount: 0 });
  });

  it("rejects private, insecure and duplicate URLs", () => {
    const result = validateSitemapEntries([
      { url: "http://localhost:3000/admin" },
      { url: "https://radarune.com/discover" },
      { url: "https://radarune.com/discover" },
    ]);

    expect(result.valid).toBe(false);
    expect(result.duplicateCount).toBe(1);
    expect(result.errors).toEqual(expect.arrayContaining([
      "HTTPS olmayan URL: http://localhost:3000/admin",
      "Gizli alan sitemap'e eklenmiş: http://localhost:3000/admin",
      "1 yinelenen URL bulundu.",
    ]));
  });
});
