import { describe, expect, it, vi } from "vitest";
vi.hoisted(() => {
  process.env.DATABASE_URL = "mysql://test:test@localhost:3306/test";
  process.env.BETTER_AUTH_SECRET = "test-secret-that-is-long-enough-for-tests";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
});
import { providerConfigurationRequired } from "@/features/integrations/domain/external-provider";
import { spotifyProviderService } from "@/features/integrations/server/adapters/spotify-provider.service";
import { youtubeProviderService } from "@/features/integrations/server/adapters/youtube-provider.service";
import { normalizeExternalUrl } from "@/features/integrations/domain/external-provider";

describe("external provider adapters", () => {
  it("configuration eksik olduğunda sonuç üretmez", () => {
    const result = providerConfigurationRequired("YOUTUBE", ["YOUTUBE_API_KEY"]);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.code).toBe("CONFIGURATION_REQUIRED");
  });

  it("official embed URL'lerini sabit provider domainlerine bağlar", () => {
    expect(youtubeProviderService.getEmbedUrl("video-1")).toBe("https://www.youtube-nocookie.com/embed/video-1");
    expect(spotifyProviderService.getEmbedUrl("track-1")).toBe("https://open.spotify.com/embed/track/track-1");
  });

  it("YouTube video kimliğini normalize edilmiş URL'de korur", () => {
    expect(normalizeExternalUrl("https://www.youtube.com/watch?v=video-1&utm_source=test")).toBe("https://www.youtube.com/watch?v=video-1");
  });

  it("Spotify preview yoksa null olarak korur", () => {
    const result = spotifyProviderService.normalizeMetadata({
      id: "track-1",
      name: "Gerçek metadata kaydı",
      duration_ms: 180000,
      preview_url: null,
      artists: [{ name: "Sanatçı" }],
      external_urls: { spotify: "https://open.spotify.com/track/track-1" },
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.playable).toBe(true);
  });

  it("YouTube Shorts içeriklerini başlık, açıklama veya etiket üzerinden reddeder", () => {
    for (const field of [
      { title: "Yeni şarkı #shorts" },
      { title: "Yeni şarkı", description: "Daha fazlası: /shorts/" },
      { title: "Yeni şarkı", tags: ["shorts"] },
    ]) {
      const result = youtubeProviderService.normalizeMetadata({
        id: "short-video",
        snippet: { categoryId: "10", channelTitle: "Sanatçı", ...field },
        status: { privacyStatus: "public", embeddable: true },
      });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.message).toContain("Shorts");
    }
  });

  it("YouTube kategorisi Music olmayan içerikleri reddeder", () => {
    const result = youtubeProviderService.normalizeMetadata({
      id: "non-music-video",
      snippet: { categoryId: "24", title: "Komedi videosu", channelTitle: "Kanal" },
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.message).toContain("müzik kategorisinde");
  });

  it("Shorts olmayan Music videosunu içe aktarır", () => {
    const result = youtubeProviderService.normalizeMetadata({
      id: "music-video",
      snippet: { categoryId: "10", title: "Yeni şarkı - Official Audio", channelTitle: "Sanatçı" },
      contentDetails: { duration: "PT3M12S" },
      status: { privacyStatus: "public", embeddable: true },
    });
    expect(result.success).toBe(true);
  });
});
