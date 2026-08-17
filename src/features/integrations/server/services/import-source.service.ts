import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { env } from "@/lib/env";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import {
  importModerationDecisionSchema,
  importSourceCreateSchema,
  type ImportModerationDecisionInput,
  type ImportSourceCreateInput,
} from "@/features/integrations/schemas/import.schema";
import {
  normalizeExternalUrl,
  type ExternalMediaMetadata,
  type ExternalProviderKey,
} from "@/features/integrations/domain/external-provider";
import { spotifyProviderService } from "@/features/integrations/server/adapters/spotify-provider.service";
import { youtubeProviderService } from "@/features/integrations/server/adapters/youtube-provider.service";
import { importRepository } from "@/features/integrations/server/repositories/import.repository";
import { integrationCredentialService } from "@/features/integrations/server/services/integration-credential.service";
import { youtubeAdminCredentialService } from "@/features/integrations/server/services/youtube-admin-credential.service";
import { prisma } from "@/server/prisma/prisma";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

type SourceReference = { provider: ExternalProviderKey; externalId: string };

function providerForType(type: ImportSourceCreateInput["type"]): ExternalProviderKey | null {
  if (type.startsWith("YOUTUBE")) return "YOUTUBE";
  if (type.startsWith("SPOTIFY")) return "SPOTIFY";
  return null;
}

function providerImportEnabled(provider: ExternalProviderKey) {
  return provider === "YOUTUBE" ? env.YOUTUBE_IMPORT_ENABLED : env.SPOTIFY_IMPORT_ENABLED;
}

/**
 * YouTube credentials were historically saved by a dedicated admin service
 * with its own encryption envelope. Read that record first, then fall back to
 * the shared credential resolver for environment-backed and newer records.
 * This keeps existing installations active after the credential services were
 * unified without asking the administrator to enter the API key again.
 */
async function runtimeProviderCredentials(organizationId: string, provider: ExternalProviderKey) {
  if (provider === "YOUTUBE") {
    const apiKey = await youtubeAdminCredentialService.getApiKey(organizationId);
    if (apiKey) return { apiKey };
  }
  return integrationCredentialService.runtime(organizationId, provider);
}

function sourceReference(type: ImportSourceCreateInput["type"], rawUrl: string): SourceReference | null {
  if (type === "YOUTUBE_SEARCH") return { provider: "YOUTUBE", externalId: rawUrl };
  if (type === "SPOTIFY_SEARCH") return { provider: "SPOTIFY", externalId: rawUrl };
  const url = new URL(rawUrl);
  if (type.startsWith("YOUTUBE")) {
    const playlistId = url.searchParams.get("list");
    // Channel links are often copied with a trailing slash or a tab suffix
    // such as `/videos`. Normalize those variants before extracting the
    // provider identity so the import source is not rejected unnecessarily.
    const pathname = url.pathname.replace(/\/+$/, "");
    const channelMatch = /^\/channel\/([^/]+)(?:\/.*)?$/.exec(pathname);
    if (type === "YOUTUBE_PLAYLIST" && playlistId) {
      const seedVideoId = url.searchParams.get("v");
      return { provider: "YOUTUBE", externalId: playlistId.startsWith("RD") && seedVideoId ? `mix:${playlistId}:${seedVideoId}` : playlistId };
    }
    if (type === "YOUTUBE_CHANNEL" && channelMatch?.[1]) return { provider: "YOUTUBE", externalId: channelMatch[1] };
    if (type === "YOUTUBE_CHANNEL") {
      const handleMatch = /^\/@([^/]+)(?:\/.*)?$/.exec(pathname);
      const usernameMatch = /^\/user\/([^/]+)(?:\/.*)?$/.exec(pathname);
      const customMatch = /^\/c\/([^/]+)(?:\/.*)?$/.exec(pathname);
      if (handleMatch?.[1]) return { provider: "YOUTUBE", externalId: `handle:@${handleMatch[1]}` };
      if (usernameMatch?.[1]) return { provider: "YOUTUBE", externalId: `username:${usernameMatch[1]}` };
      if (customMatch?.[1]) return { provider: "YOUTUBE", externalId: `search:${customMatch[1]}` };
    }
  }
  if (type.startsWith("SPOTIFY")) {
    const expectedSegment = type === "SPOTIFY_ARTIST" ? "artist" : type === "SPOTIFY_PLAYLIST" ? "playlist" : "album";
    const match = new RegExp(`^/${expectedSegment}/([^/]+)$`).exec(url.pathname.replace(/\/+$/, ""));
    if (match?.[1]) return { provider: "SPOTIFY", externalId: match[1] };
  }
  return null;
}

function normalizedUrlForStorage(value: string) {
  const normalized = normalizeExternalUrl(value);
  if (normalized.length > 768) throw new Error("Import URL’si depolama sınırını aşıyor.");
  return normalized;
}

function externalIdFromYouTubeItem(item: unknown): string | null {
  if (typeof item !== "object" || item === null) return null;
  const value = item as { id?: string | { videoId?: string }; contentDetails?: { videoId?: string }; snippet?: { resourceId?: { videoId?: string } } };
  if (typeof value.id === "string") return value.id;
  return value.id?.videoId ?? value.contentDetails?.videoId ?? value.snippet?.resourceId?.videoId ?? null;
}

function spotifyTracks(value: unknown): unknown[] {
  if (typeof value !== "object" || value === null) return [];
  const response = value as { tracks?: { items?: Array<{ track?: unknown }> }; items?: unknown[] };
  if (Array.isArray(response.tracks?.items)) return response.tracks.items.map((item) => item.track).filter((item): item is unknown => item !== undefined);
  return response.items
    ? response.items.map((item) => (typeof item === "object" && item !== null && "track" in item ? item.track : item)).filter(Boolean)
    : [];
}

function artistSlug(value: string) {
  return value.toLocaleLowerCase("tr-TR").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "sanatci";
}

function importedArtistName(metadata: ExternalMediaMetadata) {
  const explicit = metadata.artistName?.trim();
  if (explicit) return explicit;
  // Provider metadata can occasionally omit the artist. A stable title-derived
  // name still gives the import an editable profile instead of leaving it
  // orphaned in the discovery feed.
  const fromTitle = metadata.title.split(/\s+[|–—-]\s+/)[0]?.trim();
  return fromTitle || "Bilinmeyen sanatçı";
}

export class ImportSourceService {
  async create(actor: FinanceActorContext, input: unknown) {
    assertAdminPermission(actor, "imports.manage");
    const parsed = importSourceCreateSchema.parse(input);
    const provider = providerForType(parsed.type);
    const searchType = parsed.type === "YOUTUBE_SEARCH" || parsed.type === "SPOTIFY_SEARCH";
    const sourceUrl = parsed.url || (searchType ? `search://${parsed.type.toLowerCase()}?q=${encodeURIComponent(parsed.query ?? parsed.name)}` : "");
    const reference = sourceUrl ? sourceReference(parsed.type, searchType ? (parsed.query ?? parsed.name) : sourceUrl) : null;
    if (!provider || !reference) {
      throw new Error("Desteklenmeyen import bağlantısı. YouTube kanal için /channel/UC…, /@handle, /user/… veya /c/…; playlist/Mix için ?list=… içeren watch veya playlist bağlantısı kullanın. Spotify kaynaklarında /artist/, /playlist/ veya /album/ bağlantısı gerekir.");
    }

    const credentials = await runtimeProviderCredentials(actor.organizationId, provider);
    const configuration = provider === "YOUTUBE"
      ? youtubeProviderService.validateConfiguration(credentials?.apiKey)
      : spotifyProviderService.validateConfiguration(credentials ?? undefined);
    const importEnabled = providerImportEnabled(provider) || Boolean(credentials);
    const status = configuration.success && importEnabled
      ? (parsed.active ? "ACTIVE" : "PAUSED")
      : "CONFIGURATION_REQUIRED";
    return importRepository.createSource({
      organizationId: actor.organizationId,
      createdByUserId: actor.userId,
      type: parsed.type,
      provider,
      providerExternalId: reference.externalId,
      url: sourceUrl,
      name: parsed.name,
      artistId: parsed.artistId ?? null,
      active: configuration.success && importEnabled && parsed.active,
      autoPublish: parsed.autoPublish,
      ownershipVerified: false,
      requiresReview: parsed.requiresReview,
      minDurationMs: parsed.minDurationMs ?? null,
      maxDurationMs: parsed.maxDurationMs ?? null,
      maxAgeDays: parsed.maxAgeDays ?? null,
      maxItems: parsed.maxItems,
      frequencyMinutes: parsed.frequencyMinutes,
      scheduleMode: parsed.scheduleMode,
      status,
    });
  }

  async list(actor: FinanceActorContext) {
    assertAdminPermission(actor, "imports.view");
    return importRepository.listSources(actor.organizationId);
  }

  async listReviewItems(actor: FinanceActorContext) {
    assertAdminPermission(actor, "imports.view");
    return importRepository.listReviewItems(actor.organizationId);
  }

  async run(actor: FinanceActorContext, sourceId: string) {
    assertAdminPermission(actor, "imports.manage");
    return this.executeRun({ organizationId: actor.organizationId, sourceId, actorUserId: actor.userId });
  }

  async runScheduled(sourceId: string) {
    const source = await importRepository.findSourceById(sourceId);
    if (!source) throw new Error("Import kaynağı bulunamadı.");
    return this.executeRun({ organizationId: source.organizationId, sourceId, actorUserId: source.createdByUserId });
  }

  private async executeRun(input: { organizationId: string; sourceId: string; actorUserId: string }) {
    const { organizationId, sourceId, actorUserId } = input;
    const source = await importRepository.findSource(organizationId, sourceId);
    if (!source) throw new Error("Import kaynağı bulunamadı.");
    if (source.status === "PAUSED") throw new Error("Import kaynağı duraklatılmış.");

    // A source can have been created before the provider credentials were
    // configured. Validate the current runtime credentials before claiming the
    // source so that an old CONFIGURATION_REQUIRED source can recover without
    // being deleted and recreated.
    const providerKey = source.provider;
    if (!providerKey) throw new Error("Import provider bilgisi eksik.");
    const credentials = await runtimeProviderCredentials(organizationId, providerKey);
    const configuration = providerKey === "YOUTUBE"
      ? youtubeProviderService.validateConfiguration(credentials?.apiKey)
      : spotifyProviderService.validateConfiguration(credentials ?? undefined);
    const importEnabled = providerImportEnabled(providerKey) || Boolean(credentials);

    if (!importEnabled) {
      const message = providerKey === "YOUTUBE"
        ? "YouTube import etkin değil. Admin > Entegrasyonlar > YouTube bölümünden geçerli YouTube Data API anahtarını kaydedip bağlantıyı test edin."
        : "Spotify import etkin değil. Admin > Entegrasyonlar > Spotify bölümünden geçerli bağlantı bilgilerini kaydedip bağlantıyı test edin.";
      await prisma.importSource.update({
        where: { id: source.id },
        data: { status: "CONFIGURATION_REQUIRED", active: false, lastError: message },
      });
      throw new Error(message);
    }

    if (!configuration.success) {
      await prisma.importSource.update({
        where: { id: source.id },
        data: { status: "CONFIGURATION_REQUIRED", active: false, lastError: configuration.message },
      });
      throw new Error(configuration.message);
    }

    if (!source.active || source.status === "CONFIGURATION_REQUIRED") {
      await prisma.importSource.update({
        where: { id: source.id },
        data: { status: "ACTIVE", active: true, lastError: null },
      });
    }

    const lockToken = crypto.randomUUID();
    const claimed = await importRepository.claimSource(organizationId, sourceId, lockToken, new Date(Date.now() + 10 * 60_000));
    if (!claimed) throw new Error("Import kaynağı zaten çalışıyor.");

    try {
      const run = await importRepository.createRun({
        organizationId,
        sourceId: source.id,
        cursorBefore: source.cursor,
      });
      const metadata = await this.fetchSourceMetadata(source, credentials);
      if (!metadata.success) {
        await prisma.$transaction(async (client) => {
          await importRepository.finishRun(run.id, { status: "FAILED", completedAt: new Date(), errorMessage: metadata.message }, client);
          await client.importSource.update({ where: { id: source.id }, data: { status: metadata.code === "RATE_LIMITED" ? "RATE_LIMITED" : "FAILED", lastError: metadata.message, lastCheckedAt: new Date() } });
          await auditLogService.create({ organizationId, actorUserId, action: "IMPORT_RUN_FAILED", entityType: "ImportSource", entityId: source.id, metadata: { code: metadata.code } }, client);
        });
        return metadata;
      }

      // Keep the per-source cap enforced by fetchSourceMetadata. Larger
      // channel imports still remain review-only until an admin approves them.
      const youtubeMetadata = metadata.data;
      const eligibleArtistIds = source.provider === "YOUTUBE"
        ? await this.youtubeEligibleArtistIds(organizationId, source.artistId)
        : null;
      let duplicateCount = 0;
      let importedCount = 0;
      let pendingReviewCount = 0;
      let failedCount = 0;
      let skippedCount = 0;
      for (const item of youtubeMetadata) {
        // Search results are intentionally review-only and may contain artists
        // that do not exist in Radarune yet. They must reach moderation so an
        // admin can review them and create/link the right artist profile.
        const reviewableYouTubeCollection = source.type === "YOUTUBE_CHANNEL" || source.type === "YOUTUBE_PLAYLIST" || source.type === "YOUTUBE_SEARCH";
        if (source.provider === "YOUTUBE" && !this.isEligibleYouTubeItem(item, eligibleArtistIds, source.artistId, reviewableYouTubeCollection)) {
          skippedCount += 1;
          continue;
        }
        const result = await this.processItem(organizationId, source.id, run.id, source.artistId, source.createdByUserId, source.requiresReview || !source.autoPublish || !source.ownershipVerified || !item.playable || !item.embeddable, item);
        if (result === "DUPLICATE") duplicateCount += 1;
        else if (result === "IMPORTED") importedCount += 1;
        else if (result === "PENDING_REVIEW") pendingReviewCount += 1;
        else if (result === "FAILED") failedCount += 1;
      }

      await prisma.$transaction(async (client) => {
        await importRepository.finishRun(run.id, { status: failedCount > 0 ? "PARTIAL" : "SUCCEEDED", completedAt: new Date(), detectedCount: youtubeMetadata.length, duplicateCount, importedCount, failedCount }, client);
        await client.importSource.update({ where: { id: source.id }, data: { status: "ACTIVE", lastCheckedAt: new Date(), lastSuccessAt: new Date(), lastError: null } });
        await auditLogService.create({ organizationId, actorUserId, action: "IMPORT_RUN_COMPLETED", entityType: "ImportSource", entityId: source.id, metadata: { detectedCount: youtubeMetadata.length, duplicateCount, importedCount, pendingReviewCount, failedCount, skippedCount } }, client);
      });
      return { success: true as const, detectedCount: youtubeMetadata.length, duplicateCount, importedCount, pendingReviewCount, failedCount, skippedCount };
    } finally {
      await importRepository.releaseSource(organizationId, sourceId, lockToken);
    }
  }

  async moderate(actor: FinanceActorContext, itemId: string, input: unknown) {
    assertAdminPermission(actor, "imports.review");
    const parsed = importModerationDecisionSchema.parse(input) as ImportModerationDecisionInput;
    const item = await prisma.importItem.findFirst({ where: { id: itemId, organizationId: actor.organizationId }, select: { id: true, status: true, externalMediaSourceId: true } });
    if (!item) throw new Error("Import kaydı bulunamadı.");
    if (!["PENDING_REVIEW", "DETECTED"].includes(item.status)) throw new Error("Import kaydı artık incelenebilir durumda değil.");
    return prisma.$transaction(async (client) => {
      const updatedCount = await client.importItem.updateMany({
        where: { id: item.id, organizationId: actor.organizationId, status: item.status },
        data: { status: parsed.decision, reviewedAt: new Date() },
      });
      if (updatedCount.count !== 1) throw new Error("Import kaydı durumu değişti; işlem artık geçerli değil.");
      const updated = await client.importItem.findUniqueOrThrow({ where: { id: item.id }, select: { id: true, status: true } });
      if (item.externalMediaSourceId) {
        await client.externalMediaSource.update({ where: { id: item.externalMediaSourceId }, data: { status: parsed.decision === "APPROVED" ? "ACTIVE" : "BLOCKED" } });
      }
      await client.importModerationDecision.create({ data: { importItemId: item.id, actorUserId: actor.userId, decision: parsed.decision, reason: parsed.reason } });
      await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: `IMPORT_${parsed.decision}`, entityType: "ImportItem", entityId: item.id, metadata: { reason: parsed.reason } }, client);
      return updated;
    });
  }

  async verifyOwnership(actor: FinanceActorContext, sourceId: string) {
    assertAdminPermission(actor, "imports.manage");
    const source = await importRepository.findSource(actor.organizationId, sourceId);
    if (!source) throw new Error("Import kaynağı bulunamadı.");
    return prisma.$transaction(async (client) => {
      const updated = await client.importSource.update({ where: { id: source.id }, data: { ownershipVerified: true }, select: { id: true, ownershipVerified: true } });
      await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "IMPORT_SOURCE_OWNERSHIP_VERIFIED", entityType: "ImportSource", entityId: source.id }, client);
      return updated;
    });
  }

  private async fetchSourceMetadata(source: { type: string; provider: "YOUTUBE" | "SPOTIFY" | null; providerExternalId: string | null; lastCheckedAt: Date | null; maxItems?: number }, credentials: Record<string, string> | null) {
    if (!source.provider || !source.providerExternalId) return { success: false as const, code: "PROVIDER_ERROR" as const, message: "Import provider kimliği eksik." };
    if (source.provider === "YOUTUBE") {
      const maxItems = Math.min(source.maxItems ?? 100, 200);

      const collectYouTubePages = async (fetchPage: (pageToken?: string) => Promise<Awaited<ReturnType<typeof youtubeProviderService.searchMusic>>>) => {
        const items: unknown[] = [];
        let pageToken: string | undefined;
        for (let page = 0; page < 4 && items.length < maxItems; page += 1) {
          const response = await fetchPage(pageToken);
          if (!response.success) return response;
          items.push(...(response.data.items ?? []));
          pageToken = response.data.nextPageToken;
          if (!pageToken) break;
        }
        return { success: true as const, data: items.slice(0, maxItems) };
      };

      const resolveYouTubeMetadata = async (items: unknown[]) => {
        const ids = items.map(externalIdFromYouTubeItem).filter((id): id is string => Boolean(id));
        const detailItems: unknown[] = [];
        for (let offset = 0; offset < ids.length; offset += 50) {
          const details = await youtubeProviderService.getVideos(ids.slice(offset, offset + 50), credentials?.apiKey);
          if (!details.success) return details;
          detailItems.push(...(details.data.items ?? []));
        }
        const detected = youtubeProviderService.detectNewVideos(detailItems, source.lastCheckedAt ?? undefined);
        if (!detected.success) return detected;
        const unique = [...new Map(detected.data.map((item) => [item.externalId, item])).values()];
        return { ...detected, data: unique.slice(0, maxItems) };
      };

      if (source.type === "YOUTUBE_SEARCH") {
        const query = source.providerExternalId;
        if (!query) return { success: false as const, code: "PROVIDER_ERROR" as const, message: "YouTube arama terimi eksik." };
        const collected = await collectYouTubePages((pageToken) => youtubeProviderService.searchMusic(query, pageToken, credentials?.apiKey));
        return collected.success ? resolveYouTubeMetadata(collected.data) : collected;
      }
      if (source.type === "YOUTUBE_CHANNEL") {
        const collected = await collectYouTubePages((pageToken) => youtubeProviderService.listChannelVideosByReference(source.providerExternalId!, pageToken, credentials?.apiKey));
        return collected.success ? resolveYouTubeMetadata(collected.data) : collected;
      }
      // RD Mix lists may reject playlistItems.list; fall back to the copied
      // seed video so a valid watch+list link still imports useful content.
      const [playlistId, seedVideoId] = source.providerExternalId!.startsWith("mix:")
        ? source.providerExternalId!.split(":").slice(1)
        : [source.providerExternalId!, null];
      const collected = await collectYouTubePages((pageToken) => youtubeProviderService.listPlaylistVideos(playlistId, pageToken, credentials?.apiKey));
      if (!collected.success && seedVideoId) return resolveYouTubeMetadata([{ id: seedVideoId }]);
      return collected.success ? resolveYouTubeMetadata(collected.data) : collected;
    }

    const provider = spotifyProviderService;
    const maxItems = Math.min(source.maxItems ?? 100, 200);
    if (source.type === "SPOTIFY_SEARCH") {
      const response = await provider.searchTracks(source.providerExternalId, credentials ?? undefined);
      if (!response.success) return response;
      return provider.detectNewReleases(spotifyTracks(response.data).slice(0, maxItems), new Set());
    }
    if (source.type === "SPOTIFY_PLAYLIST") {
      const tracks: unknown[] = [];
      for (let offset = 0; offset < maxItems; offset += 100) {
        const response = await provider.listPlaylistTracks(source.providerExternalId, credentials ?? undefined, offset);
        if (!response.success) return response;
        const page = spotifyTracks(response.data);
        tracks.push(...page);
        if (page.length < 100) break;
      }
      return provider.detectNewReleases(tracks.slice(0, maxItems), new Set());
    }
    if (source.type === "SPOTIFY_ALBUM") {
      const response = await provider.getAlbum(source.providerExternalId, credentials ?? undefined);
      if (!response.success) return response;
      return provider.detectNewReleases(spotifyTracks(response.data).slice(0, maxItems), new Set());
    }
    const albumPages: unknown[] = [];
    for (let offset = 0; offset < maxItems; offset += 50) {
      const response = await provider.getArtistAlbums(source.providerExternalId, credentials ?? undefined, offset);
      if (!response.success) return response;
      const page = response.data.items ?? [];
      albumPages.push(...page);
      if (page.length < 50) break;
    }
    const albumIds = albumPages
      .map((item) => {
        if (typeof item !== "object" || item === null) return null;
        const value = item as { id?: string };
        return value.id ?? null;
      })
      .filter((id): id is string => Boolean(id));
    const tracks: unknown[] = [];
    for (const albumId of albumIds.slice(0, maxItems)) {
      const album = await provider.getAlbum(albumId, credentials ?? undefined);
      if (album.success) tracks.push(...spotifyTracks(album.data));
      if (tracks.length >= maxItems) break;
    }
    return provider.detectNewReleases(tracks.slice(0, maxItems), new Set());
  }

  private async youtubeEligibleArtistIds(organizationId: string, assignedArtistId: string | null) {
    const artists = await prisma.artist.findMany({
      where: {
        organizationId,
        ...(assignedArtistId ? { id: assignedArtistId } : {}),
      OR: [{ youtubeProfileUrl: { not: null } }, { applications: { some: { status: "APPROVED" } } }],
      },
      select: {
        id: true,
        name: true,
        youtubeProfileUrl: true,
        applications: { where: { status: "APPROVED" }, select: { id: true }, take: 1 },
      },
    });
    return artists
      .filter((artist) => artist.applications.length > 0 || Boolean(artist.youtubeProfileUrl && /youtube\.com\/(?:channel\/|@|c\/|user\/)/i.test(artist.youtubeProfileUrl)))
      .map((artist) => ({ id: artist.id, name: artist.name.trim().toLocaleLowerCase("tr-TR") }));
  }

  private isEligibleYouTubeItem(metadata: ExternalMediaMetadata, artists: Array<{ id: string; name: string }> | null, assignedArtistId: string | null, reviewableCollection = false) {
    if (reviewableCollection && !assignedArtistId) return true;
    if (!artists || artists.length === 0) return false;
    if (assignedArtistId) return true;
    const artistName = metadata.artistName?.trim().toLocaleLowerCase("tr-TR");
    return Boolean(artistName && artists.some((artist) => artist.name === artistName));
  }

  private async processItem(organizationId: string, sourceId: string, runId: string, artistId: string | null, ownerUserId: string | null, requiresReview: boolean, metadata: ExternalMediaMetadata) {
    try {
      const existing = await importRepository.findExternalMedia(organizationId, metadata.provider, metadata.externalId);
      if (existing) {
        // Older imports may have been stored without an artist relation. Heal
        // that record on the next run so every imported item has an editable
        // artist profile.
        await prisma.$transaction(async (client) => {
          if (!existing.artistId) {
            const resolvedArtistId = await this.ensureImportedArtist(client, organizationId, artistId, ownerUserId, metadata);
            await client.externalMediaSource.update({ where: { id: existing.id }, data: { artistId: resolvedArtistId, artistName: metadata.artistName ?? existing.artistName, thumbnailUrl: metadata.thumbnailUrl ?? existing.thumbnailUrl } });
          }
          await client.importItem.create({ data: { organizationId, runId, sourceId, externalMediaSourceId: existing.id, provider: metadata.provider, externalId: metadata.externalId, title: metadata.title, artistName: metadata.artistName, durationMs: metadata.durationMs, status: "DUPLICATE", matchConfidence: "EXACT" } });
        });
        return "DUPLICATE" as const;
      }
      const matchingTrack = await importRepository.findMatchingTrack(organizationId, metadata.title, metadata.durationMs, { isrc: metadata.isrc, upc: metadata.upc });
      const status = requiresReview || matchingTrack ? "PENDING_REVIEW" : "IMPORTED";
      await prisma.$transaction(async (client) => {
        const resolvedArtistId = await this.ensureImportedArtist(client, organizationId, artistId, ownerUserId, metadata);
        const external = await client.externalMediaSource.create({ data: { organizationId, provider: metadata.provider, externalId: metadata.externalId, externalUrl: metadata.externalUrl, normalizedUrl: normalizedUrlForStorage(metadata.externalUrl), embedUrl: metadata.embedUrl, title: metadata.title, artistName: metadata.artistName, durationMs: metadata.durationMs, thumbnailUrl: metadata.thumbnailUrl, publishedAt: metadata.publishedAt, playable: metadata.playable, embeddable: metadata.embeddable, regionRestrictions: metadata.regionRestrictions as Prisma.InputJsonValue, metadataHash: metadata.metadataHash, lastCheckedAt: new Date(), status: status === "IMPORTED" && metadata.playable ? "ACTIVE" : "UNAVAILABLE", artistId: resolvedArtistId } });
        const item = await client.importItem.create({ data: { organizationId, runId, sourceId, externalMediaSourceId: external.id, provider: metadata.provider, externalId: metadata.externalId, title: metadata.title, artistName: metadata.artistName, durationMs: metadata.durationMs, status, matchConfidence: matchingTrack ? "HIGH" : "NONE" } });
        if (matchingTrack) await client.importMatch.create({ data: { organizationId, importItemId: item.id, trackId: matchingTrack.id, releaseId: matchingTrack.releaseId, artistId: resolvedArtistId, confidence: metadata.isrc || metadata.upc ? "EXACT" : "HIGH", reason: metadata.isrc || metadata.upc ? "ISRC/UPC eşleşmesi bulundu. Hak sahipliği doğrulanmadan otomatik dağıtım yapılmaz." : "Başlık ve süre eşleşmesi bulundu; hak sahipliği doğrulanmadan otomatik birleştirme yapılmadı.", automatic: Boolean(metadata.isrc || metadata.upc) } });
      });
      return status === "IMPORTED" ? ("IMPORTED" as const) : ("PENDING_REVIEW" as const);
    } catch {
      await prisma.importItem.create({ data: { organizationId, runId, sourceId, provider: metadata.provider, externalId: metadata.externalId, title: metadata.title, artistName: metadata.artistName, durationMs: metadata.durationMs, status: "FAILED", errorMessage: "Import kaydı oluşturulamadı." } });
      return "FAILED" as const;
    }
  }

  private async ensureImportedArtist(client: Prisma.TransactionClient, organizationId: string, requestedArtistId: string | null, ownerUserId: string | null, metadata: ExternalMediaMetadata) {
    if (requestedArtistId) {
      const requested = await client.artist.findFirst({ where: { id: requestedArtistId, organizationId }, select: { id: true } });
      if (requested) return requested.id;
    }
    const name = importedArtistName(metadata);
    const normalizeName = (value: string) => value
      .replace(/\s+-\s+Topic$/i, "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i")
      .replace(/[^a-z0-9]+/g, "")
      .trim();
    const normalizedName = normalizeName(name);
    const existing = (await client.artist.findMany({
      where: { organizationId },
      select: { id: true, name: true, profileImageUrl: true, youtubeProfileUrl: true, spotifyProfileUrl: true },
    })).find((artist) => normalizeName(artist.name) === normalizedName);
    const profileData = metadata.provider === "YOUTUBE"
      ? { youtubeProfileUrl: metadata.externalUrl }
      : { spotifyProfileUrl: metadata.externalUrl };
    if (existing) {
      await client.artist.update({ where: { id: existing.id }, data: { ...(ownerUserId ? { ownerUserId } : {}), ...(existing.profileImageUrl ? {} : { profileImageUrl: metadata.thumbnailUrl }), ...(existing.youtubeProfileUrl || metadata.provider !== "YOUTUBE" ? {} : profileData), ...(existing.spotifyProfileUrl || metadata.provider !== "SPOTIFY" ? {} : profileData), profilePublishedAt: new Date() } });
      return existing.id;
    }
    const baseSlug = artistSlug(name);
    let slug = baseSlug;
    for (let attempt = 2; attempt < 100; attempt += 1) {
      const taken = await client.artist.findFirst({ where: { organizationId, slug }, select: { id: true } });
      if (!taken) break;
      slug = `${baseSlug}-${attempt}`;
    }
    const created = await client.artist.create({ data: { organizationId, createdByUserId: ownerUserId, ownerUserId, name, slug, sortName: name, type: "SOLO", profileImageUrl: metadata.thumbnailUrl, profilePublishedAt: new Date(), ...profileData }, select: { id: true } });
    return created.id;
  }
}

export const importSourceService = new ImportSourceService();
