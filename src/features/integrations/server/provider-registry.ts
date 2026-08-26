import {
  type ExternalProviderAdapter,
  type ExternalProviderKey,
} from "@/features/integrations/domain/external-provider";
import { spotifyProviderService } from "@/features/integrations/server/adapters/spotify-provider.service";
import { youtubeProviderService } from "@/features/integrations/server/adapters/youtube-provider.service";

const adapters: Partial<Record<ExternalProviderKey, ExternalProviderAdapter>> = {
  YOUTUBE: youtubeProviderService,
  SPOTIFY: spotifyProviderService,
};

export class ExternalProviderRegistry {
  get(provider: ExternalProviderKey) {
    const adapter = adapters[provider];
    if (!adapter) throw new Error(`Provider adapter bulunamadı: ${provider}`);
    return adapter;
  }

  list() {
    return Object.values(adapters);
  }
}

export const externalProviderRegistry = new ExternalProviderRegistry();
