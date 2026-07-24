import type {
  DistributionProviderAdapter,
  DistributionReleasePayload,
  DistributionValidationResult,
} from "@/features/distribution-hub/domain/provider";

export class RevelatorAdapter implements DistributionProviderAdapter {
  readonly key = "REVELATOR" as const;

  readonly identifierPolicy = {
    isrc: {
      existingRelease: "required" as const,
      newRelease: "optional" as const,
    },
    upc: {
      existingRelease: "required" as const,
      newRelease: "optional" as const,
    },
    providerMayGenerate: true,
  };

  validateRelease(payload: DistributionReleasePayload): DistributionValidationResult {
    const issues: string[] = [];

    if (!payload.title.trim()) {
      issues.push("Release title is required.");
    }

    if (payload.isExistingRelease && !payload.upc) {
      issues.push("Existing releases require an existing UPC.");
    }

    for (const track of payload.tracks) {
      if (payload.isExistingRelease && !track.isrc) {
        issues.push(`Track ${track.title} requires an existing ISRC.`);
      }
    }

    return issues.length === 0 ? { success: true } : { success: false, issues };
  }
}
