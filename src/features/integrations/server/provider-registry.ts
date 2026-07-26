import {
  type ExternalProviderAdapter,
  type ExternalProviderKey,
} from "@/features/integrations/domain/external-provider";
import { spotifyProviderService } from "@/features/integrations/server/adapters/spotify-provider.service";
import { youtubeProviderService } from "@/features/integrations/server/adapters/youtube-provider.service";

const adapters: Record<ExternalProviderKey, ExternalProviderAdapter> = {
  YOUTUBE: youtubeProviderService,
  SPOTIFY: spotifyProviderService,
};

export class ExternalProviderRegistry {
  get(provider: ExternalProviderKey) {
    return adapters[provider];
  }

  list() {
    return Object.values(adapters);
  }
}

export const externalProviderRegistry = new ExternalProviderRegistry();
