export type PlayerSourceType =
  "RADARUNE_AUDIO" | "YOUTUBE" | "SPOTIFY_EMBED" | "EXTERNAL_PREVIEW";

export type PlayerCapabilities = {
  seek: boolean;
  volume: boolean;
  queue: boolean;
  officialEmbed: boolean;
};

export type PlayerItem = {
  id: string;
  title: string;
  artistName: string;
  source: PlayerSourceType;
  sourceLabel: string;
  playbackUrl: string | null;
  embedUrl: string | null;
  /** Original provider URL, kept as a fallback when an embed URL is unavailable. */
  externalUrl?: string | null;
  capabilities: PlayerCapabilities;
};

export const playerCapabilities: Record<PlayerSourceType, PlayerCapabilities> =
  {
    RADARUNE_AUDIO: {
      seek: true,
      volume: true,
      queue: true,
      officialEmbed: false,
    },
    YOUTUBE: { seek: false, volume: false, queue: false, officialEmbed: true },
    SPOTIFY_EMBED: {
      seek: false,
      volume: false,
      queue: false,
      officialEmbed: true,
    },
    EXTERNAL_PREVIEW: {
      seek: false,
      volume: true,
      queue: true,
      officialEmbed: false,
    },
  };

export function canDisplayExternalSource(
  item: Pick<PlayerItem, "source" | "embedUrl">,
) {
  return (
    item.source === "RADARUNE_AUDIO" ||
    (item.embedUrl !== null && playerCapabilities[item.source].officialEmbed)
  );
}
