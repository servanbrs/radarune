export const distributionProviderKeys = [
  "ONE_RPM",
  "FUGA",
  "SYMPHONIC",
  "REVELATOR",
  "INTERNAL",
] as const;

export const distributionCapabilityKeys = [
  "CREATE_RELEASE",
  "UPDATE_RELEASE",
  "TAKEDOWN",
  "STATUS_SYNC",
  "WEBHOOKS",
  "ROYALTY_REPORTS",
  "AUTO_ISRC",
  "AUTO_UPC",
  "CONTENT_ID",
  "DOLBY_ATMOS",
  "PRESAVE",
] as const;

export const providerEnvironmentKeys = ["SANDBOX", "PRODUCTION"] as const;
export const distributionJobStatusKeys = [
  "PENDING",
  "VALIDATING",
  "QUEUED",
  "PROCESSING",
  "WAITING_PROVIDER",
  "RETRY_SCHEDULED",
  "SUCCEEDED",
  "PARTIALLY_SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "MANUAL_REVIEW",
] as const;
export const deliveryStatusKeys = [
  "NOT_SENT",
  "QUEUED",
  "SUBMITTED",
  "ACCEPTED",
  "PROCESSING",
  "DELIVERED",
  "LIVE",
  "REJECTED",
  "FAILED",
  "TAKEDOWN_PENDING",
  "TAKEN_DOWN",
] as const;

export type DistributionProviderKey = (typeof distributionProviderKeys)[number];
export type DistributionCapabilityKey = (typeof distributionCapabilityKeys)[number];
export type ProviderEnvironment = (typeof providerEnvironmentKeys)[number];
export type DistributionJobStatus = (typeof distributionJobStatusKeys)[number];
export type DeliveryStatus = (typeof deliveryStatusKeys)[number];

export type DistributionValidationIssue = {
  code: string;
  field: string;
  message: string;
  severity: "ERROR" | "WARNING";
};

export type DistributionValidationResult =
  | {
      success: true;
      issues: DistributionValidationIssue[];
    }
  | {
      success: false;
      issues: DistributionValidationIssue[];
    };

export type DistributionProviderRuntimeConfiguration = {
  environment: ProviderEnvironment;
  credentials: Record<string, string>;
  publicMetadata: Record<string, string>;
  webhookSecret?: string;
};

export type CanonicalDistributionPayload = {
  organizationId: string;
  releaseId: string;
  releaseVersion: number;
  releaseStatus: "APPROVED";
  title: string;
  subtitle?: string;
  isExistingRelease: boolean;
  upc?: string;
  releaseType: string;
  labelName?: string;
  copyrightLine?: string;
  productionLine?: string;
  releaseDate: Date;
  originalReleaseDate?: Date;
  artworkUrl: string;
  languageCode?: string;
  explicit: boolean;
  presaveEnabled: boolean;
  contentIdEnabled: boolean;
  dolbyAtmosEnabled: boolean;
  artists: Array<{
    artistId: string;
    name: string;
    role: "PRIMARY" | "FEATURED";
  }>;
  tracks: Array<{
    trackId: string;
    title: string;
    isrc?: string;
    audioFileUrl: string;
    durationSeconds?: number;
    explicit: boolean;
    languageCode?: string;
    contributors: Array<{
      name: string;
      role: string;
    }>;
  }>;
  stores: Array<{
    code: string;
    enabled: boolean;
  }>;
  territories: string[];
};

export type DistributionSubmissionContext = {
  idempotencyKey: string;
  payload: CanonicalDistributionPayload;
};

export type ProviderReleaseMutationResult = {
  externalReleaseId: string;
  rawStatus: string;
  generatedUpc?: string;
  generatedTrackIsrcs?: Array<{
    isrc: string;
    trackId: string;
  }>;
};

export type ProviderStatusSnapshot = {
  externalReleaseId: string;
  rawStatus: string;
  deliveryStatus: DeliveryStatus;
  stores?: Array<{
    externalStoreReference?: string;
    liveUrl?: string;
    status: DeliveryStatus;
    storeCode: string;
    territoryCode?: string;
  }>;
};

export type VerifiedProviderWebhook = {
  eventId: string;
  payload: string;
  rawType: string;
  receivedAt: Date;
};

export type NormalizedProviderWebhook = {
  deliveryStatus?: DeliveryStatus;
  errorMessage?: string;
  eventId: string;
  externalReleaseId?: string;
  occurredAt: Date;
  rawPayload: string;
  rawType: string;
};

export type DistributionProviderFailureCode =
  | "CONFIGURATION_REQUIRED"
  | "UNSUPPORTED_CAPABILITY"
  | "VALIDATION_ERROR"
  | "WEBHOOK_VERIFICATION_FAILED"
  | "PROVIDER_ERROR";

export type DistributionProviderResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      code: DistributionProviderFailureCode;
      message: string;
      missingFields?: string[];
      issues?: DistributionValidationIssue[];
      retryable?: boolean;
    };

export interface DistributionProviderAdapter {
  readonly key: DistributionProviderKey;
  readonly capabilities: ReadonlySet<DistributionCapabilityKey>;

  supportsCapability(capability: DistributionCapabilityKey): boolean;
  validateConfiguration(
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): DistributionProviderResult<{ checkedAt: Date }>;
  testConnection(
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<{ checkedAt: Date }>>;
  validateRelease(payload: CanonicalDistributionPayload): DistributionValidationResult;
  createRelease(
    input: DistributionSubmissionContext,
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<ProviderReleaseMutationResult>>;
  updateRelease(
    input: DistributionSubmissionContext & {
      externalReleaseId: string;
    },
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<ProviderReleaseMutationResult>>;
  requestTakedown(
    input: {
      externalReleaseId: string;
      releaseId: string;
    },
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<{ rawStatus: string }>>;
  getReleaseStatus(
    input: {
      externalReleaseId: string;
      releaseId: string;
    },
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<ProviderStatusSnapshot>>;
  normalizeWebhook(
    input: {
      payload: string;
      signature?: string;
    },
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<NormalizedProviderWebhook>>;
}
