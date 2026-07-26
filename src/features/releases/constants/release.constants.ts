export const releaseTypeValues = ["SINGLE", "EP", "ALBUM"] as const;
export const releaseStatusValues = [
  "DRAFT",
  "PENDING_REVIEW",
  "REVISION_REQUESTED",
  "APPROVED",
  "REJECTED",
  "QUEUED",
  "PROCESSING",
  "DISTRIBUTED",
  "LIVE",
  "TAKEDOWN_REQUESTED",
  "REMOVED",
] as const;

export const releaseArtistRoleValues = [
  "PRIMARY_ARTIST",
  "FEATURED_ARTIST",
  "REMIXER",
  "PRODUCER",
] as const;

export const contributorRoleValues = [
  "COMPOSER",
  "LYRICIST",
  "PRODUCER",
  "MIXING_ENGINEER",
  "MASTERING_ENGINEER",
  "ARRANGER",
  "VOCALIST",
  "BACKGROUND_VOCALIST",
  "GUITARIST",
  "BASSIST",
  "PIANIST",
  "DRUMMER",
] as const;

export const releaseStoreValues = [
  "SPOTIFY",
  "APPLE_MUSIC",
  "YOUTUBE_MUSIC",
  "AMAZON_MUSIC",
  "DEEZER",
  "TIKTOK",
  "INSTAGRAM",
  "FACEBOOK",
  "TIDAL",
  "PANDORA",
  "SOUNDCLOUD",
  "SHAZAM",
] as const;

export const distributionProviderValues = [
  "ONE_RPM",
  "FUGA",
  "SYMPHONIC",
  "REVELATOR",
  "INTERNAL",
] as const;

export const acceptedAudioMimeTypes = ["audio/wav", "audio/x-wav", "audio/flac", "audio/x-flac"] as const;
export const acceptedArtworkMimeTypes = ["image/jpeg", "image/png"] as const;

export const maxAudioFileBytes = 500 * 1024 * 1024;
export const maxArtworkFileBytes = 20 * 1024 * 1024;
export const minArtworkPixels = 3000;

export const releaseTypeLabels: Record<(typeof releaseTypeValues)[number], string> = {
  SINGLE: "Single",
  EP: "EP",
  ALBUM: "Albüm",
};

export const releaseStatusLabels: Record<(typeof releaseStatusValues)[number], string> = {
  DRAFT: "Taslak",
  PENDING_REVIEW: "İnceleme bekliyor",
  REVISION_REQUESTED: "Revizyon istendi",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  QUEUED: "Dağıtım kuyruğunda",
  PROCESSING: "İşleniyor",
  DISTRIBUTED: "Dağıtıldı",
  LIVE: "Yayında",
  TAKEDOWN_REQUESTED: "Kaldırma istendi",
  REMOVED: "Kaldırıldı",
};

export const storeLabels: Record<(typeof releaseStoreValues)[number], string> = {
  SPOTIFY: "Spotify",
  APPLE_MUSIC: "Apple Music",
  YOUTUBE_MUSIC: "YouTube Music",
  AMAZON_MUSIC: "Amazon Music",
  DEEZER: "Deezer",
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIDAL: "Tidal",
  PANDORA: "Pandora",
  SOUNDCLOUD: "SoundCloud",
  SHAZAM: "Shazam",
};

export type ReleaseTypeValue = (typeof releaseTypeValues)[number];
export type ReleaseStatusValue = (typeof releaseStatusValues)[number];
export type ReleaseStoreValue = (typeof releaseStoreValues)[number];
