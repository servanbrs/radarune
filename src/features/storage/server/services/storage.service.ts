import "server-only";
import { storageProviderRegistry } from "@/features/storage/server/provider-registry";

export class StorageService {
  getAdapter() {
    const adapter = storageProviderRegistry.getConfigured();
    const configuration = adapter.validateConfiguration();
    if (!configuration.configured) {
      throw new Error(`Storage yapılandırması gerekli: ${configuration.missingFields.join(", ")}`);
    }
    return adapter;
  }

  getStatus() {
    const adapter = storageProviderRegistry.getConfigured();
    const configuration = adapter.validateConfiguration();
    return { provider: adapter.type, configuration };
  }
}

export const storageService = new StorageService();
