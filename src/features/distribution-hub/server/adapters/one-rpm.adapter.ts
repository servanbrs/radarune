import type {
  DistributionProviderAdapter,
  DistributionReleasePayload,
  DistributionValidationResult,
} from "@/features/distribution-hub/domain/provider";

export class OneRpmAdapter implements DistributionProviderAdapter {
  readonly key = "ONE_RPM" as const;

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

    if (payload.tracks.length === 0) {
      issues.push("ONErpm submissions require at least one track.");
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
