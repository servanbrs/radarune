import "server-only";
import {
  type CanonicalDistributionPayload,
  type DistributionProviderAdapter,
  type DistributionProviderResult,
  type DistributionProviderRuntimeConfiguration,
  type DistributionSubmissionContext,
  type DistributionValidationIssue,
  type DistributionValidationResult,
  type NormalizedProviderWebhook,
  type ProviderReleaseMutationResult,
  type ProviderStatusSnapshot,
} from "@/features/distribution-hub/domain/provider";

const capabilities = new Set([
  "CREATE_RELEASE",
  "UPDATE_RELEASE",
  "TAKEDOWN",
  "STATUS_SYNC",
  "WEBHOOKS",
  "AUTO_ISRC",
  "AUTO_UPC",
  "PRESAVE",
] as const);

function configurationRequired<T>(
  message: string,
  missingFields: string[],
): DistributionProviderResult<T> {
  return {
    success: false,
    code: "CONFIGURATION_REQUIRED",
    message,
    missingFields,
  };
}

function validateBasePayload(payload: CanonicalDistributionPayload): DistributionValidationIssue[] {
  const issues: DistributionValidationIssue[] = [];

  if (payload.tracks.length === 0) {
    issues.push({
      code: "TRACKS_REQUIRED",
      field: "tracks",
      message: "Dağıtım için en az bir parça gereklidir.",
      severity: "ERROR",
    });
  }

  if (payload.isExistingRelease && !payload.upc) {
    issues.push({
      code: "UPC_REQUIRED",
      field: "upc",
      message: "Mevcut yayınlar için UPC zorunludur.",
      severity: "ERROR",
    });
  }

  for (const track of payload.tracks) {
    if (payload.isExistingRelease && !track.isrc) {
      issues.push({
        code: "ISRC_REQUIRED",
        field: `tracks.${track.trackId}.isrc`,
        message: `${track.title} için mevcut ISRC zorunludur.`,
        severity: "ERROR",
      });
    }
  }

  return issues;
}

export class OneRpmAdapter implements DistributionProviderAdapter {
  readonly key = "ONE_RPM" as const;
  readonly capabilities = capabilities;

  supportsCapability(capability: (typeof capabilities extends Set<infer T> ? T : never) | string) {
    return this.capabilities.has(
      capability as (typeof capabilities extends Set<infer T> ? T : never),
    );
  }

  private getMissingFields(configuration: DistributionProviderRuntimeConfiguration | null) {
    const missingFields = [
      !configuration ? "configuration" : null,
      !configuration?.credentials.apiKey ? "apiKey" : null,
      !configuration?.credentials.accountId ? "accountId" : null,
    ].filter((value): value is string => value !== null);

    return missingFields;
  }

  validateConfiguration(
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): DistributionProviderResult<{ checkedAt: Date }> {
    const missingFields = this.getMissingFields(configuration);

    if (missingFields.length > 0) {
      return configurationRequired("ONErpm yapılandırması eksik.", missingFields);
    }

    return {
      success: true,
      data: {
        checkedAt: new Date(),
      },
    };
  }

  async testConnection(
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<{ checkedAt: Date }>> {
    return this.validateConfiguration(configuration);
  }

  validateRelease(payload: CanonicalDistributionPayload): DistributionValidationResult {
    const issues = validateBasePayload(payload);

    return issues.some((issue) => issue.severity === "ERROR")
      ? { success: false, issues }
      : { success: true, issues };
  }

  async createRelease(
    input: DistributionSubmissionContext,
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<ProviderReleaseMutationResult>> {
    void input;
    return configurationRequired(
      "ONErpm canlı gönderim için resmi API yapılandırması ve erişimi gereklidir.",
      this.getMissingFields(configuration),
    );
  }

  async updateRelease(
    input: DistributionSubmissionContext & { externalReleaseId: string },
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<ProviderReleaseMutationResult>> {
    void input;
    return configurationRequired(
      "ONErpm update çağrısı için resmi API yapılandırması gereklidir.",
      this.getMissingFields(configuration),
    );
  }

  async requestTakedown(
    input: { externalReleaseId: string; releaseId: string },
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<{ rawStatus: string }>> {
    void input;
    return configurationRequired(
      "ONErpm takedown çağrısı için resmi API yapılandırması gereklidir.",
      this.getMissingFields(configuration),
    );
  }

  async getReleaseStatus(
    input: { externalReleaseId: string; releaseId: string },
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<ProviderStatusSnapshot>> {
    void input;
    return configurationRequired(
      "ONErpm status sync için resmi API yapılandırması gereklidir.",
      this.getMissingFields(configuration),
    );
  }

  async normalizeWebhook(
    input: { payload: string; signature?: string },
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<NormalizedProviderWebhook>> {
    void input;
    return configurationRequired(
      "ONErpm webhook doğrulaması için resmi webhook secret yapılandırması gereklidir.",
      this.getMissingFields(configuration),
    );
  }
}
