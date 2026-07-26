import "server-only";

export type PreSaveProviderResult<T> =
  | { success: true; data: T }
  | { success: false; code: "CONFIGURATION_REQUIRED" | "INVALID_STATE" | "PROVIDER_ERROR"; message: string };

export interface PreSaveProviderAdapter {
  provider: "SPOTIFY" | "APPLE_MUSIC" | "EMAIL_REMINDER";
  validateConfiguration(): Promise<PreSaveProviderResult<{ configured: boolean }>>;
  createAuthorizationUrl(): Promise<PreSaveProviderResult<{ url: string }>>;
  exchangeAuthorizationCode(): Promise<PreSaveProviderResult<{ providerUserId: string }>>;
  refreshAccessToken(): Promise<PreSaveProviderResult<{ expiresAt: Date }>>;
  saveRelease(): Promise<PreSaveProviderResult<{ savedAt: Date }>>;
  followArtist(): Promise<PreSaveProviderResult<{ followedAt: Date }>>;
  getUserProfile(): Promise<PreSaveProviderResult<{ providerUserId: string; email?: string }>>;
  revokeAccess(): Promise<PreSaveProviderResult<{ revokedAt: Date }>>;
  supportsCapability(capability: "SAVE_RELEASE" | "FOLLOW_ARTIST" | "ADD_TO_LIBRARY" | "EMAIL_CAPTURE" | "OAUTH" | "WEBHOOKS"): boolean;
}

export class ConfigurationRequiredPreSaveAdapter implements PreSaveProviderAdapter {
  constructor(public readonly provider: "SPOTIFY" | "APPLE_MUSIC") {}

  async validateConfiguration() {
    return {
      success: false as const,
      code: "CONFIGURATION_REQUIRED" as const,
      message: `${this.provider} pre-save entegrasyonu için resmi API yapılandırması gerekli.`,
    };
  }

  async createAuthorizationUrl() {
    return this.validateConfiguration();
  }

  async exchangeAuthorizationCode() {
    return this.validateConfiguration();
  }

  async refreshAccessToken() {
    return this.validateConfiguration();
  }

  async saveRelease() {
    return this.validateConfiguration();
  }

  async followArtist() {
    return this.validateConfiguration();
  }

  async getUserProfile() {
    return this.validateConfiguration();
  }

  async revokeAccess() {
    return this.validateConfiguration();
  }

  supportsCapability() {
    return false;
  }
}

export class EmailReminderPreSaveAdapter implements PreSaveProviderAdapter {
  provider = "EMAIL_REMINDER" as const;

  async validateConfiguration() {
    return { success: true as const, data: { configured: true } };
  }

  async createAuthorizationUrl() {
    return {
      success: false as const,
      code: "CONFIGURATION_REQUIRED" as const,
      message: "E-posta hatırlatma modu OAuth kullanmaz.",
    };
  }

  async exchangeAuthorizationCode() {
    return this.createAuthorizationUrl();
  }

  async refreshAccessToken() {
    return this.createAuthorizationUrl();
  }

  async saveRelease() {
    return this.createAuthorizationUrl();
  }

  async followArtist() {
    return this.createAuthorizationUrl();
  }

  async getUserProfile() {
    return this.createAuthorizationUrl();
  }

  async revokeAccess() {
    return this.createAuthorizationUrl();
  }

  supportsCapability(capability: "SAVE_RELEASE" | "FOLLOW_ARTIST" | "ADD_TO_LIBRARY" | "EMAIL_CAPTURE" | "OAUTH" | "WEBHOOKS") {
    return capability === "EMAIL_CAPTURE";
  }
}

export const preSaveProviders = {
  SPOTIFY: new ConfigurationRequiredPreSaveAdapter("SPOTIFY"),
  APPLE_MUSIC: new ConfigurationRequiredPreSaveAdapter("APPLE_MUSIC"),
  EMAIL_REMINDER: new EmailReminderPreSaveAdapter(),
};
