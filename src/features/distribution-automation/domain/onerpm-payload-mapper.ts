import type { CanonicalDistributionPayload } from "@/features/distribution-hub/domain/provider";

export type OneRpmFormPayload = {
  releaseType: string;
  releaseTitle: string;
  primaryArtist: string;
  featuredArtists: string[];
  label?: string;
  genres: string[];
  language?: string;
  explicit: boolean;
  releaseDate: string;
  originalReleaseDate?: string;
  previouslyReleased: boolean;
  UPC?: string;
  artwork: string;
  tracks: Array<{
    title: string;
    version?: string;
    ISRC?: string;
    language?: string;
    explicit: boolean;
    composers: string[];
    lyricists: string[];
    producers: string[];
    audio: string;
  }>;
  stores: string[];
  territories: string[];
};

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function namesForRole(
  contributors: CanonicalDistributionPayload["tracks"][number]["contributors"],
  role: string,
) {
  return contributors.filter((contributor) => contributor.role === role).map((contributor) => contributor.name);
}

export function mapCanonicalPayloadToOneRpmForm(
  payload: CanonicalDistributionPayload,
): OneRpmFormPayload {
  const primaryArtist = payload.artists.find((artist) => artist.role === "PRIMARY");
  if (!primaryArtist) throw new Error("ONErpm payload için ana sanatçı gereklidir.");
  if (!payload.artworkUrl) throw new Error("ONErpm payload için kapak gereklidir.");
  if (payload.tracks.length === 0) throw new Error("ONErpm payload için en az bir parça gereklidir.");

  return {
    releaseType: payload.releaseType,
    releaseTitle: payload.title,
    primaryArtist: primaryArtist.name,
    featuredArtists: payload.artists.filter((artist) => artist.role === "FEATURED").map((artist) => artist.name),
    ...(payload.labelName ? { label: payload.labelName } : {}),
    genres: [],
    ...(payload.languageCode ? { language: payload.languageCode } : {}),
    explicit: payload.explicit,
    releaseDate: dateOnly(payload.releaseDate),
    ...(payload.originalReleaseDate ? { originalReleaseDate: dateOnly(payload.originalReleaseDate) } : {}),
    previouslyReleased: payload.isExistingRelease,
    ...(payload.upc ? { UPC: payload.upc } : {}),
    artwork: payload.artworkUrl,
    tracks: payload.tracks.map((track) => ({
      title: track.title,
      ...(track.isrc ? { ISRC: track.isrc } : {}),
      ...(track.languageCode ? { language: track.languageCode } : {}),
      explicit: track.explicit,
      composers: namesForRole(track.contributors, "COMPOSER"),
      lyricists: namesForRole(track.contributors, "LYRICIST"),
      producers: namesForRole(track.contributors, "PRODUCER"),
      audio: track.audioFileUrl,
    })),
    stores: payload.stores.filter((store) => store.enabled).map((store) => store.code),
    territories: payload.territories,
  };
}

