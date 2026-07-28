export type ExternalProviderKey = "YOUTUBE" | "SPOTIFY";

export type ProviderFailureCode =
  | "CONFIGURATION_REQUIRED"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "PROVIDER_ERROR";

export type ProviderResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      code: ProviderFailureCode;
      message: string;
      retryAfterSeconds?: number;
    };

export type ExternalMediaMetadata = {
  provider: ExternalProviderKey;
  externalId: string;
  externalUrl: string;
  embedUrl: string | null;
  title: string;
  artistName: string | null;
  isrc?: string | null;
  upc?: string | null;
  durationMs: number | null;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
  playable: boolean;
  embeddable: boolean;
  regionRestrictions: string[];
  metadataHash: string;
};

export type ExternalProviderAdapter = {
  readonly key: ExternalProviderKey;
  validateConfiguration(): ProviderResult<{ configured: true }>;
  testConnection(): Promise<ProviderResult<{ checkedAt: Date }>>;
  normalizeMetadata(input: unknown): ProviderResult<ExternalMediaMetadata>;
  normalizeError(error: unknown): ProviderResult<never>;
  getEmbedUrl(externalId: string): string;
};

export function providerConfigurationRequired(
  provider: ExternalProviderKey,
  fields: string[],
): ProviderResult<never> {
  return {
    success: false,
    code: "CONFIGURATION_REQUIRED",
    message: `${provider} entegrasyonu yapılandırılmamış.`,
    retryAfterSeconds: fields.length,
  };
}

export function normalizeExternalUrl(value: string): string {
  const url = new URL(value);
  url.hash = "";
  if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") {
    const videoId = url.searchParams.get("v");
    const playlistId = url.searchParams.get("list");
    url.search = "";
    if (videoId) url.searchParams.set("v", videoId);
    if (playlistId) url.searchParams.set("list", playlistId);
  } else {
    url.search = "";
  }
  return url.toString().replace(/\/$/, "");
}

export function stableMetadataHash(input: ExternalMediaMetadata): string {
  const value = [
    input.provider,
    input.externalId,
    input.title,
    input.artistName ?? "",
    input.durationMs?.toString() ?? "",
    input.publishedAt?.toISOString() ?? "",
  ].join("|");

  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
