import "server-only";
import type {
  DistributionProviderKey,
  DistributionReleasePayload,
} from "@/features/distribution-hub/domain/provider";
import { distributionProviderRegistry } from "@/features/distribution-hub/server/provider-registry";

export class DistributionValidationService {
  validateRelease(provider: DistributionProviderKey, payload: DistributionReleasePayload) {
    return distributionProviderRegistry.getAdapter(provider).validateRelease(payload);
  }
}

export const distributionValidationService = new DistributionValidationService();
