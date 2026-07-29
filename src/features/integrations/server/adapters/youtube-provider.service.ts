import "server-only";
import { env } from "@/lib/env";
import {
  providerConfigurationRequired,
  stableMetadataHash,
  type ExternalMediaMetadata,
  type ExternalProviderAdapter,
  type ProviderResult,
} from "@/features/integrations/domain/external-provider";

type YouTubeItem = {
  id?: string | { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    publishedAt?: string;
    categoryId?: string;
    thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
  };
  contentDetails?: { duration?: string };
  status?: { privacyStatus?: string; embeddable?: boolean };
};

type YouTubeResponse = {
  items?: YouTubeItem[];
  nextPageToken?: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readResponse(value: unknown): YouTubeResponse {
  if (!isObject(value) || !Array.isArray(value.items)) return {};
  return value as YouTubeResponse;
}

function parseDuration(value: string | undefined): number | null {
  if (!value) return null;
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return (hours * 3_600 + minutes * 60 + seconds) * 1_000;
}

function videoId(item: YouTubeItem): string | null {
  if (typeof item.id === "string") return item.id;
  return item.id?.videoId ?? null;
}

export class YouTubeProviderService implements ExternalProviderAdapter {
  readonly key = "YOUTUBE" as const;

  validateConfiguration(apiKeyOverride?: string): ProviderResult<{ configured: true }> {
    return (apiKeyOverride ?? env.YOUTUBE_API_KEY)
      ? { success: true, data: { configured: true } }
      : providerConfigurationRequired("YOUTUBE", ["YOUTUBE_API_KEY"]);
  }

  async testConnection(apiKeyOverride?: string): Promise<ProviderResult<{ checkedAt: Date }>> {
    const config = this.validateConfiguration(apiKeyOverride);
    if (!config.success) return config;
    const response = await this.request("i18nRegions", { part: "snippet", maxResults: "1" }, apiKeyOverride);
    if (!response.success) return response;
    return { success: true, data: { checkedAt: new Date() } };
  }

  async getChannel(channelId: string) {
    return this.request("channels", { part: "snippet,contentDetails,status", id: channelId });
  }

  async listChannelVideos(channelId: string, pageToken?: string) {
    return this.request("search", {
      part: "snippet",
      channelId,
      type: "video",
      videoCategoryId: "10",
      order: "date",
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });
  }

  async getPlaylist(playlistId: string) {
    return this.request("playlists", { part: "snippet,status", id: playlistId });
  }

  async listPlaylistVideos(playlistId: string, pageToken?: string) {
    return this.request("playlistItems", {
      part: "snippet,contentDetails,status",
      playlistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });
  }

  async getVideo(videoIdValue: string) {
    return this.request("videos", {
      part: "snippet,contentDetails,status",
      id: videoIdValue,
    });
  }

  async getVideos(videoIds: string[]) {
    const uniqueIds = [...new Set(videoIds)].filter(Boolean);
    if (uniqueIds.length === 0) return { success: true as const, data: { items: [] as YouTubeItem[] } };
    return this.request("videos", {
      part: "snippet,contentDetails,status",
      id: uniqueIds.slice(0, 50).join(","),
    });
  }

  detectNewVideos(items: unknown[], publishedAfter?: Date): ProviderResult<ExternalMediaMetadata[]> {
    const normalized: ExternalMediaMetadata[] = [];
    for (const item of items) {
      const result = this.normalizeMetadata(item);
      if (!result.success) continue;
      if (publishedAfter && result.data.publishedAt && result.data.publishedAt <= publishedAfter) continue;
      normalized.push(result.data);
    }
    return { success: true, data: normalized };
  }

  supportsEmbedding() {
    return true;
  }

  normalizeMetadata(input: unknown): ProviderResult<ExternalMediaMetadata> {
    if (!isObject(input)) return this.normalizeError(new Error("YouTube metadata yanıtı geçersiz."));
    const item = input as YouTubeItem;
    // YouTube category 10 is Music. Do not import general entertainment,
    // vlog or gaming videos into Radarune's music discovery catalog.
    if (item.snippet?.categoryId && item.snippet.categoryId !== "10") {
      return this.normalizeError(new Error("Bu YouTube içeriği müzik kategorisinde değil."));
    }
    const id = videoId(item);
    const title = item.snippet?.title?.trim();
    if (!id || !title) return this.normalizeError(new Error("YouTube videosu için kimlik veya başlık eksik."));
    const publishedAt = item.snippet?.publishedAt ? new Date(item.snippet.publishedAt) : null;
    const metadata: ExternalMediaMetadata = {
      provider: "YOUTUBE",
      externalId: id,
      externalUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
      embedUrl: item.status?.embeddable === false ? null : this.getEmbedUrl(id),
      title,
      artistName: item.snippet?.channelTitle?.trim() || null,
      durationMs: parseDuration(item.contentDetails?.duration),
      thumbnailUrl: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? null,
      publishedAt: publishedAt && !Number.isNaN(publishedAt.valueOf()) ? publishedAt : null,
      playable: item.status?.privacyStatus === "public",
      embeddable: item.status?.privacyStatus === "public" && item.status?.embeddable !== false,
      regionRestrictions: [],
      metadataHash: "",
    };
    return { success: true, data: { ...metadata, metadataHash: stableMetadataHash(metadata) } };
  }

  normalizeError(error: unknown): ProviderResult<never> {
    const message = error instanceof Error ? error.message : "YouTube isteği başarısız oldu.";
    return { success: false, code: "PROVIDER_ERROR", message };
  }

  getEmbedUrl(externalId: string) {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(externalId)}`;
  }

  private async request(path: string, params: Record<string, string>, apiKeyOverride?: string) {
    const config = this.validateConfiguration(apiKeyOverride);
    if (!config.success) return config;
    const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
    Object.entries({ ...params, key: apiKeyOverride ?? env.YOUTUBE_API_KEY ?? "" }).forEach(([key, value]) => url.searchParams.set(key, value));
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
      const payload: unknown = await response.json();
      if (response.status === 403) {
        const reason = isObject(payload) && isObject(payload.error) && Array.isArray(payload.error.errors)
          ? String((payload.error.errors[0] as Record<string, unknown> | undefined)?.reason ?? "")
          : "";
        return { success: false as const, code: "RATE_LIMITED" as const, message: reason === "API_KEY_HTTP_REFERRER_BLOCKED" ? "YouTube anahtarı web sitesi kısıtlamasıyla engellendi. Sunucu kullanımı için Google Cloud'da IP kısıtlaması kullanın." : "YouTube API kotası veya erişim sınırı aşıldı." };
      }
      if (response.status === 404) return { success: false as const, code: "NOT_FOUND" as const, message: "YouTube kaynağı bulunamadı." };
      if (!response.ok) return this.normalizeError(new Error("YouTube API isteği başarısız oldu."));
      return { success: true as const, data: readResponse(payload) };
    } catch (error) {
      return this.normalizeError(error);
    }
  }
}

export const youtubeProviderService = new YouTubeProviderService();
