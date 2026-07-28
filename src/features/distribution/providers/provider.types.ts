export const distributionProviderIds = [
  "INTERNAL",
  "ONERPM",
  "FUGA",
] as const;

export type DistributionProviderId =
  (typeof distributionProviderIds)[number];

export type ProviderDeliveryMode =
  | "AUTOMATED"
  | "MANUAL_EXPORT"
  | "INTERNAL";

export type RequirementSeverity =
  | "ERROR"
  | "WARNING"
  | "INFO";

export type ContributorCategory =
  | "COMPOSITION"
  | "PERFORMANCE"
  | "PRODUCTION";

export type ContributorRole =
  | "COMPOSER"
  | "LYRICIST"
  | "SONGWRITER"
  | "ARRANGER"
  | "TRANSLATOR"
  | "ADAPTER"
  | "LEAD_VOCALIST"
  | "BACKGROUND_VOCALIST"
  | "PERFORMER"
  | "INSTRUMENTALIST"
  | "CONDUCTOR"
  | "ORCHESTRA"
  | "CHOIR"
  | "PRODUCER"
  | "CO_PRODUCER"
  | "EXECUTIVE_PRODUCER"
  | "MIXING_ENGINEER"
  | "MASTERING_ENGINEER"
  | "RECORDING_ENGINEER";

export type ReleaseField =
  | "title"
  | "versionTitle"
  | "versionType"
  | "primaryLanguage"
  | "metadataLanguage"
  | "primaryGenre"
  | "secondaryGenre"
  | "labelId"
  | "catalogNumber"
  | "upc"
  | "copyrightP"
  | "copyrightC"
  | "courtesyLine"
  | "plannedReleaseDate"
  | "originalReleaseDate"
  | "previouslyReleased";

export type TrackField =
  | "title"
  | "versionTitle"
  | "versionType"
  | "trackNumber"
  | "discNumber"
  | "language"
  | "metadataLanguage"
  | "explicit"
  | "instrumental"
  | "previouslyReleased"
  | "isrc"
  | "lyrics"
  | "previewStartSeconds";

export type ArtworkRequirements = {
  required: boolean;
  minimumWidth: number;
  minimumHeight: number;
  square: boolean;
  allowedFormats: Array<"JPEG" | "PNG">;
  maximumFileSizeMb: number;
  requireRgb: boolean;
};

export type AudioRequirements = {
  required: boolean;
  allowedFormats: Array<"WAV" | "FLAC">;
  minimumSampleRateHz: number;
  minimumBitDepth: number;
  allowMono: boolean;
  allowStereo: boolean;
  allowFloatingPointWav: boolean;
};

export type ContributorRequirements = {
  requireLegalName: boolean;
  requireFirstAndLastName: boolean;
  requireSharePercentage: boolean;
  requireShareTotal100: boolean;
  requiredCategories: ContributorCategory[];
  allowedRoles: ContributorRole[];
};

export type ProviderRequirements = {
  releaseFields: {
    required: ReleaseField[];
    optional: ReleaseField[];
  };

  trackFields: {
    required: TrackField[];
    optional: TrackField[];
  };

  contributors: ContributorRequirements;
  artwork: ArtworkRequirements;
  audio: AudioRequirements;

  codes: {
    canAssignUpc: boolean;
    canAssignIsrc: boolean;
    requireExistingUpcWhenPreviouslyReleased: boolean;
    requireExistingIsrcWhenPreviouslyReleased: boolean;
  };

  rights: {
    requireMasterRightsDeclaration: boolean;
    requireCompositionRightsDeclaration: boolean;
    requireSampleDeclaration: boolean;
    requireCoverDeclaration: boolean;
    requireRemixDeclaration: boolean;
    requireAiContentDeclaration: boolean;
  };
};

export type DistributionProviderProfile = {
  id: DistributionProviderId;
  name: string;
  enabled: boolean;
  priority: number;
  deliveryMode: ProviderDeliveryMode;
  requirements: ProviderRequirements;
};

export type ResolvedProviderRequirements = {
  providers: DistributionProviderId[];
  releaseFields: {
    required: ReleaseField[];
    optional: ReleaseField[];
  };
  trackFields: {
    required: TrackField[];
    optional: TrackField[];
  };
  contributors: ContributorRequirements;
  artwork: ArtworkRequirements;
  audio: AudioRequirements;
  codes: ProviderRequirements["codes"];
  rights: ProviderRequirements["rights"];
};
