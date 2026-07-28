import "server-only";
import type { CanonicalDistributionPayload } from "@/features/distribution-hub/domain/provider";
import { releaseRepository } from "@/features/releases/server/repositories/release.repository";

function storageReference(storageKey: string) {
  return `storage:${storageKey}`;
}

function toProviderArtistRole(role: string): "PRIMARY" | "FEATURED" {
  return role === "PRIMARY_ARTIST" ? "PRIMARY" : "FEATURED";
}

export class DistributionPayloadService {
  async buildFromApprovedRelease(params: {
    organizationId: string;
    releaseId: string;
  }): Promise<
    | {
        success: true;
        data: CanonicalDistributionPayload;
      }
    | {
        success: false;
        message: string;
      }
  > {
    const release = await releaseRepository.findDetailById(params.releaseId);

    if (!release || release.organizationId !== params.organizationId) {
      return {
        success: false,
        message: "Yayın bulunamadı.",
      };
    }

    if (release.status !== "APPROVED") {
      return {
        success: false,
        message: "Yalnızca onaylanmış yayınlar dağıtım kuyruğuna alınabilir.",
      };
    }

    const artwork = release.uploads.find(
      (upload) => upload.id === release.artworkUploadId && upload.kind === "ARTWORK",
    );

    const video = release.videoDistributionEnabled && release.videoUploadId
      ? release.uploads.find((upload) => upload.id === release.videoUploadId && upload.kind === "VIDEO")
      : null;

    if (!artwork) {
      return {
        success: false,
        message: "Dağıtım için kapak görseli bulunamadı.",
      };
    }

    const tracks: CanonicalDistributionPayload["tracks"] = [];
    for (const track of release.tracks) {
      const audio = track.uploads.find(
        (upload) => upload.id === track.audioUploadId && upload.kind === "AUDIO",
      );

      if (!audio) {
        return {
          success: false,
          message: `${track.title} için ses dosyası bulunamadı.`,
        };
      }

      tracks.push({
        trackId: track.id,
        title: track.versionTitle ? `${track.title} (${track.versionTitle})` : track.title,
        ...(track.isrc ? { isrc: track.isrc } : {}),
        audioFileUrl: storageReference(audio.storageKey),
        ...(track.durationMs ? { durationSeconds: Math.round(track.durationMs / 1000) } : {}),
        explicit: track.explicit,
        languageCode: track.language,
        contributors: track.contributors.map((contributor) => ({
          name: contributor.contributor.name,
          role: contributor.role,
        })),
      });
    }

    return {
      success: true,
      data: {
        organizationId: release.organizationId,
        releaseId: release.id,
        releaseVersion: 1,
        releaseStatus: "APPROVED",
        title: release.title,
        ...(release.versionTitle ? { subtitle: release.versionTitle } : {}),
        isExistingRelease: release.previouslyReleased,
        ...(release.upc ? { upc: release.upc } : {}),
        releaseType: release.type,
        ...(release.label?.name ? { labelName: release.label.name } : {}),
        copyrightLine: release.copyrightC,
        productionLine: release.copyrightP,
        releaseDate: release.plannedReleaseDate ?? new Date(),
        ...(release.originalReleaseDate ? { originalReleaseDate: release.originalReleaseDate } : {}),
        artworkUrl: storageReference(artwork.storageKey),
        languageCode: release.primaryLanguage,
        explicit: release.explicit,
        presaveEnabled: release.presaveEnabled,
        contentIdEnabled: release.contentIdEnabled,
        dolbyAtmosEnabled: release.dolbyAtmosEnabled,
        ...(video ? { video: { fileUrl: storageReference(video.storageKey), stores: Array.isArray(release.videoStores) ? release.videoStores.filter((value): value is string => typeof value === "string") : ["RADARUNE_MUSIC", "YOUTUBE", "VEVO", "META_VIDEO"], revenueEligible: true } } : {}),
        artists: release.artists.map((artist) => ({
          artistId: artist.artistId,
          name: artist.artist.name,
          role: toProviderArtistRole(artist.role),
        })),
        tracks,
        stores: release.stores.map((store) => ({
          code: store.storeCode,
          enabled: true,
        })),
        territories: release.worldwideDistribution
          ? ["WW"]
          : release.territories.map((territory) => territory.territoryCode),
      },
    };
  }
}

export const distributionPayloadService = new DistributionPayloadService();
