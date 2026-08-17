import "server-only";

import { normalizeExternalUrl, type ExternalMediaMetadata } from "@/features/integrations/domain/external-provider";
import { spotifyProviderService } from "@/features/integrations/server/adapters/spotify-provider.service";
import { youtubeProviderService } from "@/features/integrations/server/adapters/youtube-provider.service";
import { integrationCredentialService } from "@/features/integrations/server/services/integration-credential.service";
import { prisma } from "@/server/prisma/prisma";

const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "open.spotify.com",
  "www.open.spotify.com",
  "spotify.com",
  "music.apple.com",
  "itunes.apple.com",
  "deezer.com",
  "www.deezer.com",
]);

type LinkResolutionResult = {
  warning?: string;
  metadata?: ExternalMediaMetadata;
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Dış sağlayıcı zaman aşımına uğradı.")), timeoutMs);
    }),
  ]);
}

function parseYouTubeId(url: URL) {
  if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
  return url.searchParams.get("v")
    ?? url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1]
    ?? null;
}

function parseSpotifyTrackId(url: URL) {
  const match = url.pathname.match(/^(?:\/intl-[^/]+)?\/track\/([^/]+)/);
  return match?.[1] ?? null;
}

function hostAllowed(url: URL) {
  return ALLOWED_HOSTS.has(url.hostname.toLowerCase());
}

function sourceKind(url: URL) {
  const hostname = url.hostname.toLowerCase();
  if (hostname.includes("youtube") || hostname === "youtu.be") return "YOUTUBE" as const;
  if (hostname.includes("spotify")) return "SPOTIFY" as const;
  if (hostname.includes("apple.com") || hostname.includes("itunes")) return "APPLE_MUSIC" as const;
  if (hostname.includes("deezer")) return "DEEZER" as const;
  return null;
}

async function resolveProviderMetadata(
  organizationId: string,
  kind: "YOUTUBE" | "SPOTIFY",
  url: URL,
): Promise<LinkResolutionResult> {
  try {
    const credentials = await withTimeout(
      integrationCredentialService.runtime(organizationId, kind),
      2_500,
    );

    if (kind === "YOUTUBE") {
      const videoId = parseYouTubeId(url);
      if (!videoId) return { warning: "YouTube bağlantısında video kimliği bulunamadı." };
      const apiKey = typeof credentials?.apiKey === "string" ? credentials.apiKey : undefined;
      const response = await withTimeout(youtubeProviderService.getVideo(videoId, apiKey), 5_000);
      if (!response.success) return { warning: response.message };
      const item = response.data.items?.[0];
      if (!item) return { warning: "YouTube videosu bulunamadı veya erişilemiyor." };
      const normalized = youtubeProviderService.normalizeMetadata(item);
      return normalized.success
        ? { metadata: normalized.data }
        : { warning: normalized.message };
    }

    const trackId = parseSpotifyTrackId(url);
    if (!trackId) return { warning: "Spotify bağlantısı bir parça bağlantısı olmalı." };
    const spotifyOptions = {
      ...(typeof credentials?.clientId === "string" ? { clientId: credentials.clientId } : {}),
      ...(typeof credentials?.clientSecret === "string" ? { clientSecret: credentials.clientSecret } : {}),
    };
    const response = await withTimeout(
      spotifyProviderService.getTrack(trackId, spotifyOptions),
      5_000,
    );
    if (!response.success) return { warning: response.message };
    const normalized = spotifyProviderService.normalizeMetadata(response.data);
    return normalized.success
      ? { metadata: normalized.data }
      : { warning: normalized.message };
  } catch (error) {
    return {
      warning: error instanceof Error
        ? `${kind === "YOUTUBE" ? "YouTube" : "Spotify"} otomatik içe aktarılamadı: ${error.message}`
        : "Dış sağlayıcıya bağlanılamadı; bağlantı inceleme için saklandı.",
    };
  }
}

export async function resolveAndAttachExternalLink(params: {
  organizationId: string;
  releaseId: string;
  trackId: string;
  sourceUrl?: string | undefined;
}): Promise<LinkResolutionResult> {
  const detachExistingSource = () => prisma.externalMediaSource.updateMany({
    where: { organizationId: params.organizationId, trackId: params.trackId },
    data: { trackId: null, releaseId: null },
  });

  const sourceUrl = params.sourceUrl?.trim();
  if (!sourceUrl) {
    await detachExistingSource();
    return {};
  }

  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    await detachExistingSource();
    return { warning: "Müzik bağlantısı geçerli bir URL değil." };
  }
  if (url.protocol !== "https:" || !hostAllowed(url)) {
    await detachExistingSource();
    return { warning: "Bu bağlantı desteklenen müzik sağlayıcılarından değil; güvenlik için otomatik olarak açılmadı." };
  }

  const normalizedUrl = normalizeExternalUrl(url.toString());
  const kind = sourceKind(url);
  if (!kind) {
    await detachExistingSource();
    return { warning: "Bağlantı tanınmadı; inceleme için saklandı." };
  }
  if (kind === "APPLE_MUSIC" || kind === "DEEZER") {
    await detachExistingSource();
    return { warning: `${kind === "APPLE_MUSIC" ? "Apple Music" : "Deezer"} bağlantısı kaydedildi; metadata inceleme sırasında tamamlanacak.` };
  }

  const resolved = await resolveProviderMetadata(params.organizationId, kind, url);
  if (!resolved.metadata) {
    await detachExistingSource();
    return resolved;
  }

  const metadata = resolved.metadata;
  await prisma.externalMediaSource.updateMany({
    where: {
      organizationId: params.organizationId,
      trackId: params.trackId,
      normalizedUrl: { not: normalizedUrl },
    },
    data: { trackId: null, releaseId: null },
  });
  await prisma.externalMediaSource.upsert({
    where: {
      organizationId_provider_externalId: {
        organizationId: params.organizationId,
        provider: metadata.provider,
        externalId: metadata.externalId,
      },
    },
    update: {
      externalUrl: metadata.externalUrl,
      normalizedUrl,
      embedUrl: metadata.embedUrl,
      title: metadata.title,
      artistName: metadata.artistName,
      durationMs: metadata.durationMs,
      thumbnailUrl: metadata.thumbnailUrl,
      publishedAt: metadata.publishedAt,
      playable: metadata.playable,
      embeddable: metadata.embeddable,
      regionRestrictions: metadata.regionRestrictions,
      metadataHash: metadata.metadataHash,
      lastCheckedAt: new Date(),
      status: metadata.playable ? "ACTIVE" : "UNAVAILABLE",
      releaseId: params.releaseId,
      trackId: params.trackId,
    },
    create: {
      organizationId: params.organizationId,
      provider: metadata.provider,
      externalId: metadata.externalId,
      externalUrl: metadata.externalUrl,
      normalizedUrl,
      embedUrl: metadata.embedUrl,
      title: metadata.title,
      artistName: metadata.artistName,
      durationMs: metadata.durationMs,
      thumbnailUrl: metadata.thumbnailUrl,
      publishedAt: metadata.publishedAt,
      playable: metadata.playable,
      embeddable: metadata.embeddable,
      regionRestrictions: metadata.regionRestrictions,
      metadataHash: metadata.metadataHash,
      lastCheckedAt: new Date(),
      status: metadata.playable ? "ACTIVE" : "UNAVAILABLE",
      releaseId: params.releaseId,
      trackId: params.trackId,
    },
  });
  return {};
}
