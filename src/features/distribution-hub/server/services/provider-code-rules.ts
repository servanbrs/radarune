import type {
  CanonicalDistributionPayload,
  DistributionValidationIssue,
} from "@/features/distribution-hub/domain/provider";

export function validateProviderCodeRules(input: {
  payload: CanonicalDistributionPayload;
  supportsAutoIsrc: boolean;
  supportsAutoUpc: boolean;
}) {
  const issues: DistributionValidationIssue[] = [];

  if (!input.payload.isExistingRelease && !input.payload.upc && !input.supportsAutoUpc) {
    issues.push({
      code: "UPC_REQUIRED_WITH_PROVIDER",
      field: "upc",
      message: "Provider otomatik UPC desteklemiyorsa yeni yayın için UPC girilmelidir.",
      severity: "ERROR",
    });
  }

  for (const track of input.payload.tracks) {
    if (!input.payload.isExistingRelease && !track.isrc && !input.supportsAutoIsrc) {
      issues.push({
        code: "ISRC_REQUIRED_WITH_PROVIDER",
        field: `tracks.${track.trackId}.isrc`,
        message: "Provider otomatik ISRC desteklemiyorsa yeni parçalar için ISRC girilmelidir.",
        severity: "ERROR",
      });
    }
  }

  return issues;
}
