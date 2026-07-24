import type {
  DistributionProviderAdapter,
  DistributionProviderKey,
} from "@/features/distribution-hub/domain/provider";
import { FugaAdapter } from "@/features/distribution-hub/server/adapters/fuga.adapter";
import { InternalProviderAdapter } from "@/features/distribution-hub/server/adapters/internal-provider.adapter";
import { OneRpmAdapter } from "@/features/distribution-hub/server/adapters/one-rpm.adapter";
import { RevelatorAdapter } from "@/features/distribution-hub/server/adapters/revelator.adapter";
import { SymphonicAdapter } from "@/features/distribution-hub/server/adapters/symphonic.adapter";

const adapters: Record<DistributionProviderKey, DistributionProviderAdapter> = {
  FUGA: new FugaAdapter(),
  INTERNAL: new InternalProviderAdapter(),
  ONE_RPM: new OneRpmAdapter(),
  REVELATOR: new RevelatorAdapter(),
  SYMPHONIC: new SymphonicAdapter(),
};

export class DistributionProviderRegistry {
  getAdapter(provider: DistributionProviderKey) {
    return adapters[provider];
  }

  listAdapters() {
    return Object.values(adapters);
  }
}

export const distributionProviderRegistry = new DistributionProviderRegistry();
