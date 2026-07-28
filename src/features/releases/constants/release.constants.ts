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
  "NAPSTER",
  "QOBUZ",
  "BOOMPLAY",
  "JIOSAAVN",
  "ANGHAMI",
  "AUDIOMACK",
  "TREBEL",
  "NETEASE_CLOUD_MUSIC",
  "QQ_MUSIC",
  "KUWO",
  "KUGOU",
  "JOOX",
  "GAANA",
  "WYNK",
  "MELON",
  "GENIE",
  "FLO",
  "BUGS",
  "CLARO_MUSICA",
  "MUSICAST",
  "RESSO",
  "VEVO",
  "YOUTUBE_CONTENT_ID",
  "META_AUDIO",
  "SNAPCHAT",
  "TRILLER",
  "ROUTE_NOTE",
  "LAST_FM",
  "MIXCLOUD",
  "TENCENT_MUSIC",
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
  NAPSTER: "Napster",
  QOBUZ: "Qobuz",
  BOOMPLAY: "Boomplay",
  JIOSAAVN: "JioSaavn",
  ANGHAMI: "Anghami",
  AUDIOMACK: "Audiomack",
  TREBEL: "Trebel",
  NETEASE_CLOUD_MUSIC: "NetEase Cloud Music",
  QQ_MUSIC: "QQ Music",
  KUWO: "Kuwo",
  KUGOU: "Kugou",
  JOOX: "JOOX",
  GAANA: "Gaana",
  WYNK: "Wynk Music",
  MELON: "Melon",
  GENIE: "Genie Music",
  FLO: "FLO",
  BUGS: "Bugs Music",
  CLARO_MUSICA: "Claro Música",
  MUSICAST: "Musicast",
  RESSO: "Resso",
  VEVO: "Vevo",
  YOUTUBE_CONTENT_ID: "YouTube Content ID",
  META_AUDIO: "Meta Audio",
  SNAPCHAT: "Snapchat",
  TRILLER: "Triller",
  ROUTE_NOTE: "RouteNote",
  LAST_FM: "Last.fm",
  MIXCLOUD: "Mixcloud",
  TENCENT_MUSIC: "Tencent Music",
};

export type ReleaseTypeValue = (typeof releaseTypeValues)[number];
export type ReleaseStatusValue = (typeof releaseStatusValues)[number];
export type ReleaseStoreValue = (typeof releaseStoreValues)[number];
