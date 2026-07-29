import "server-only";
import { env } from "@/lib/env";
import type { StorageProviderAdapter, StorageProviderType } from "@/features/storage/domain/storage-provider";
import { S3CompatibleStorageAdapter } from "@/features/storage/server/adapters/s3-compatible-storage.adapter";
import { ConfigurationRequiredStorageAdapter } from "@/features/storage/server/adapters/configuration-required-storage.adapter";
import { localStorageAdapter } from "@/features/storage/server/adapters/local-storage.adapter";

const configurationAdapters = {
  S3: new S3CompatibleStorageAdapter("S3"),
  S3_COMPATIBLE: new S3CompatibleStorageAdapter("S3_COMPATIBLE"),
  CLOUDFLARE_R2: new S3CompatibleStorageAdapter("CLOUDFLARE_R2"),
  DIGITALOCEAN_SPACES: new S3CompatibleStorageAdapter("DIGITALOCEAN_SPACES"),
  MINIO: new S3CompatibleStorageAdapter("MINIO"),
  SUPABASE_STORAGE: new ConfigurationRequiredStorageAdapter("SUPABASE_STORAGE"),
  AZURE_BLOB: new ConfigurationRequiredStorageAdapter("AZURE_BLOB"),
  GOOGLE_CLOUD_STORAGE: new ConfigurationRequiredStorageAdapter("GOOGLE_CLOUD_STORAGE"),
} satisfies Record<Exclude<StorageProviderType, "LOCAL">, StorageProviderAdapter>;

const adapters: Record<StorageProviderType, StorageProviderAdapter> = {
  LOCAL: localStorageAdapter,
  ...configurationAdapters,
};

export class StorageProviderRegistry {
  get(type: StorageProviderType) { return adapters[type]; }
  getConfigured() { return adapters[env.STORAGE_PROVIDER]; }
  list() { return Object.values(adapters); }
}

export const storageProviderRegistry = new StorageProviderRegistry();
