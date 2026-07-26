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
  "CONTENT_ID",
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

export class SymphonicAdapter implements DistributionProviderAdapter {
  readonly key = "SYMPHONIC" as const;
  readonly capabilities = capabilities;

  supportsCapability(capability: string) {
    return this.capabilities.has(capability as (typeof capabilities extends Set<infer T> ? T : never));
  }

  private getMissingFields(configuration: DistributionProviderRuntimeConfiguration | null) {
    return [
      !configuration ? "configuration" : null,
      !configuration?.credentials.username ? "username" : null,
      !configuration?.credentials.password ? "password" : null,
    ].filter((value): value is string => value !== null);
  }

  validateConfiguration(
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): DistributionProviderResult<{ checkedAt: Date }> {
    const missingFields = this.getMissingFields(configuration);

    if (missingFields.length > 0) {
      return configurationRequired("Symphonic yapılandırması eksik.", missingFields);
    }

    return {
      success: true,
      data: {
        checkedAt: new Date(),
      },
    };
  }

  async testConnection(configuration: DistributionProviderRuntimeConfiguration | null) {
    return this.validateConfiguration(configuration);
  }

  validateRelease(payload: CanonicalDistributionPayload): DistributionValidationResult {
    const issues: DistributionValidationIssue[] = [];

    if (payload.tracks.length === 0) {
      issues.push({
        code: "TRACKS_REQUIRED",
        field: "tracks",
        message: "Symphonic için en az bir parça gereklidir.",
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

    return issues.some((issue) => issue.severity === "ERROR")
      ? { success: false, issues }
      : { success: true, issues };
  }

  async createRelease(
    input: DistributionSubmissionContext,
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<import("@/features/distribution-hub/domain/provider").ProviderReleaseMutationResult>> {
    void input;
    return configurationRequired(
      "Symphonic canlı gönderim için resmi API yapılandırması gereklidir.",
      this.getMissingFields(configuration),
    );
  }

  async updateRelease(
    input: DistributionSubmissionContext & { externalReleaseId: string },
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<import("@/features/distribution-hub/domain/provider").ProviderReleaseMutationResult>> {
    void input;
    return configurationRequired(
      "Symphonic update çağrısı için resmi API yapılandırması gereklidir.",
      this.getMissingFields(configuration),
    );
  }

  async requestTakedown(
    input: { externalReleaseId: string; releaseId: string },
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<{ rawStatus: string }>> {
    void input;
    return configurationRequired(
      "Symphonic takedown çağrısı için resmi API yapılandırması gereklidir.",
      this.getMissingFields(configuration),
    );
  }

  async getReleaseStatus(
    input: { externalReleaseId: string; releaseId: string },
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<ProviderStatusSnapshot>> {
    void input;
    return configurationRequired(
      "Symphonic status sync için resmi API yapılandırması gereklidir.",
      this.getMissingFields(configuration),
    );
  }

  async normalizeWebhook(
    input: { payload: string; signature?: string },
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<NormalizedProviderWebhook>> {
    void input;
    return configurationRequired(
      "Symphonic webhook doğrulaması için resmi webhook secret yapılandırması gereklidir.",
      this.getMissingFields(configuration),
    );
  }
}
