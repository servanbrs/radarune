export const distributionProviderKeys = [
  "ONE_RPM",
  "FUGA",
  "SYMPHONIC",
  "REVELATOR",
  "INTERNAL",
] as const;

export type DistributionProviderKey = (typeof distributionProviderKeys)[number];

export type IdentifierPolicy = {
  isrc: {
    existingRelease: "required";
    newRelease: "optional";
  };
  upc: {
    existingRelease: "required";
    newRelease: "optional";
  };
  providerMayGenerate: boolean;
};

export type DistributionReleasePayload = {
  organizationId: string;
  releaseId: string;
  title: string;
  isExistingRelease: boolean;
  upc?: string;
  tracks: Array<{
    trackId: string;
    title: string;
    isrc?: string;
  }>;
};

export type DistributionValidationResult =
  | {
      success: true;
    }
  | {
      success: false;
      issues: string[];
    };

export interface DistributionProviderAdapter {
  readonly key: DistributionProviderKey;
  readonly identifierPolicy: IdentifierPolicy;

  validateRelease(payload: DistributionReleasePayload): DistributionValidationResult;
}
