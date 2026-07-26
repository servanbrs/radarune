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
  "CONTENT_ID",
  "DOLBY_ATMOS",
  "PRESAVE",
] as const);

export class InternalProviderAdapter implements DistributionProviderAdapter {
  readonly key = "INTERNAL" as const;
  readonly capabilities = capabilities;

  supportsCapability(capability: string) {
    return this.capabilities.has(capability as (typeof capabilities extends Set<infer T> ? T : never));
  }

  validateConfiguration(
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): DistributionProviderResult<{ checkedAt: Date }> {
    void configuration;
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
    const issues: DistributionValidationIssue[] = [];

    if (!payload.title.trim()) {
      issues.push({
        code: "TITLE_REQUIRED",
        field: "title",
        message: "Yayın adı zorunludur.",
        severity: "ERROR",
      });
    }

    if (payload.tracks.length === 0) {
      issues.push({
        code: "TRACKS_REQUIRED",
        field: "tracks",
        message: "En az bir parça gereklidir.",
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
  ): Promise<DistributionProviderResult<ProviderReleaseMutationResult>> {
    void configuration;
    return {
      success: true,
      data: {
        externalReleaseId: `internal:${input.payload.releaseId}:${input.idempotencyKey.slice(0, 12)}`,
        rawStatus: "accepted",
      },
    };
  }

  async updateRelease(
    input: DistributionSubmissionContext & { externalReleaseId: string },
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<ProviderReleaseMutationResult>> {
    void configuration;
    return {
      success: true,
      data: {
        externalReleaseId: input.externalReleaseId,
        rawStatus: "updated",
      },
    };
  }

  async requestTakedown(
    input: { externalReleaseId: string; releaseId: string },
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<{ rawStatus: string }>> {
    void input;
    void configuration;
    return {
      success: true as const,
      data: {
        rawStatus: "takedown_pending",
      },
    };
  }

  async getReleaseStatus(
    input: { externalReleaseId: string; releaseId: string },
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<ProviderStatusSnapshot>> {
    void configuration;
    return {
      success: true,
      data: {
        externalReleaseId: input.externalReleaseId,
        rawStatus: "accepted",
        deliveryStatus: "ACCEPTED",
      },
    };
  }

  async normalizeWebhook(
    input: { payload: string; signature?: string },
    configuration: DistributionProviderRuntimeConfiguration | null,
  ): Promise<DistributionProviderResult<NormalizedProviderWebhook>> {
    void configuration;

    return {
      success: true,
      data: {
        eventId: `internal:${Buffer.from(input.payload).toString("base64").slice(0, 12)}`,
        occurredAt: new Date(),
        rawPayload: input.payload,
        rawType: "internal.status",
        deliveryStatus: "ACCEPTED",
      },
    };
  }
}
