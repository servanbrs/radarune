import "server-only";
import { env } from "@/lib/env";
import {
  providerConfigurationRequired,
  stableMetadataHash,
  type ExternalMediaMetadata,
  type ExternalProviderAdapter,
  type ProviderResult,
} from "@/features/integrations/domain/external-provider";

type SpotifyTrack = {
  id?: string;
  name?: string;
  duration_ms?: number;
  external_urls?: { spotify?: string };
  preview_url?: string | null;
  artists?: Array<{ name?: string }>;
  album?: { images?: Array<{ url?: string }>; release_date?: string };
};

type SpotifyResponse = { items?: SpotifyTrack[]; tracks?: { items?: Array<{ track?: SpotifyTrack }> } };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export class SpotifyProviderService implements ExternalProviderAdapter {
  readonly key = "SPOTIFY" as const;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  validateConfiguration(): ProviderResult<{ configured: true }> {
    const missing = [
      !env.SPOTIFY_CLIENT_ID ? "SPOTIFY_CLIENT_ID" : null,
      !env.SPOTIFY_CLIENT_SECRET ? "SPOTIFY_CLIENT_SECRET" : null,
    ].filter((value): value is string => value !== null);
    return missing.length > 0
      ? providerConfigurationRequired("SPOTIFY", missing)
      : { success: true, data: { configured: true } };
  }

  async getAccessToken(): Promise<ProviderResult<{ accessToken: string; expiresAt: Date }>> {
    const config = this.validateConfiguration();
    if (!config.success) return config;
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 30_000) {
      return { success: true, data: { accessToken: this.accessToken, expiresAt: new Date(this.tokenExpiresAt) } };
    }
    try {
      const credentials = Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=client_credentials",
        cache: "no-store",
      });
      const payload: unknown = await response.json();
      if (!response.ok || !isObject(payload) || typeof payload.access_token !== "string" || typeof payload.expires_in !== "number") {
        return this.normalizeError(new Error("Spotify access token alınamadı."));
      }
      this.accessToken = payload.access_token;
      this.tokenExpiresAt = Date.now() + payload.expires_in * 1_000;
      return { success: true, data: { accessToken: this.accessToken, expiresAt: new Date(this.tokenExpiresAt) } };
    } catch (error) {
      return this.normalizeError(error);
    }
  }

  async testConnection(): Promise<ProviderResult<{ checkedAt: Date }>> {
    const token = await this.getAccessToken();
    if (!token.success) return token;
    const response = await this.request("browse/categories", token.data.accessToken);
    if (!response.success) return response;
    return { success: true, data: { checkedAt: new Date() } };
  }

  async getArtist(id: string) { return this.getResource(`artists/${encodeURIComponent(id)}`); }
  async getArtistAlbums(id: string) { return this.getResource(`artists/${encodeURIComponent(id)}/albums?limit=50`); }
  async getAlbum(id: string) { return this.getResource(`albums/${encodeURIComponent(id)}`); }
  async getTrack(id: string) { return this.getResource(`tracks/${encodeURIComponent(id)}`); }
  async getPlaylist(id: string) { return this.getResource(`playlists/${encodeURIComponent(id)}`); }
  async listPlaylistTracks(id: string) { return this.getResource(`playlists/${encodeURIComponent(id)}/tracks?limit=100`); }

  detectNewReleases(items: unknown[], knownExternalIds: ReadonlySet<string>): ProviderResult<ExternalMediaMetadata[]> {
    const normalized: ExternalMediaMetadata[] = [];
    for (const item of items) {
      const result = this.normalizeMetadata(item);
      if (result.success && !knownExternalIds.has(result.data.externalId)) normalized.push(result.data);
    }
    return { success: true, data: normalized };
  }

  getEmbedUrl(externalId: string) { return `https://open.spotify.com/embed/track/${encodeURIComponent(externalId)}`; }

  normalizeMetadata(input: unknown): ProviderResult<ExternalMediaMetadata> {
    if (!isObject(input)) return this.normalizeError(new Error("Spotify metadata yanıtı geçersiz."));
    const track = input as SpotifyTrack;
    const id = track.id?.trim();
    const title = track.name?.trim();
    if (!id || !title) return this.normalizeError(new Error("Spotify parçası için kimlik veya başlık eksik."));
    const metadata: ExternalMediaMetadata = {
      provider: "SPOTIFY",
      externalId: id,
      externalUrl: track.external_urls?.spotify ?? `https://open.spotify.com/track/${encodeURIComponent(id)}`,
      embedUrl: this.getEmbedUrl(id),
      title,
      artistName: track.artists?.map((artist) => artist.name?.trim()).filter((name): name is string => Boolean(name)).join(", ") || null,
      durationMs: typeof track.duration_ms === "number" ? track.duration_ms : null,
      thumbnailUrl: track.album?.images?.[0]?.url ?? null,
      publishedAt: track.album?.release_date ? new Date(track.album.release_date) : null,
      playable: true,
      embeddable: true,
      regionRestrictions: [],
      metadataHash: "",
    };
    return { success: true, data: { ...metadata, metadataHash: stableMetadataHash(metadata) } };
  }

  normalizeError(error: unknown): ProviderResult<never> {
    const message = error instanceof Error ? error.message : "Spotify isteği başarısız oldu.";
    return { success: false, code: "PROVIDER_ERROR", message };
  }

  private async getResource(path: string) {
    const token = await this.getAccessToken();
    if (!token.success) return token;
    return this.request(path, token.data.accessToken);
  }

  private async request(path: string, token: string) {
    try {
      const response = await fetch(`https://api.spotify.com/v1/${path}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const retryAfter = response.headers.get("retry-after");
      const payload: unknown = await response.json();
      if (response.status === 429) {
        return {
          success: false as const,
          code: "RATE_LIMITED" as const,
          message: "Spotify API hız sınırına ulaşıldı.",
          ...(retryAfter ? { retryAfterSeconds: Number(retryAfter) } : {}),
        };
      }
      if (response.status === 404) return { success: false as const, code: "NOT_FOUND" as const, message: "Spotify kaynağı bulunamadı." };
      if (!response.ok) return this.normalizeError(new Error("Spotify API isteği başarısız oldu."));
      return { success: true as const, data: payload as SpotifyResponse };
    } catch (error) {
      return this.normalizeError(error);
    }
  }
}

export const spotifyProviderService = new SpotifyProviderService();
