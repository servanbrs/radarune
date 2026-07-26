import "server-only";
import type { Readable } from "node:stream";
import type {
  MultipartUpload,
  StorageConfigurationResult,
  StorageObjectMetadata,
  StorageProviderAdapter,
  StorageProviderType,
} from "@/features/storage/domain/storage-provider";

export class ConfigurationRequiredStorageAdapter implements StorageProviderAdapter {
  constructor(readonly type: Exclude<StorageProviderType, "LOCAL">) {}

  validateConfiguration(): StorageConfigurationResult {
    return { configured: false, code: "CONFIGURATION_REQUIRED", missingFields: [this.type] };
  }

  async testConnection() { return { success: false as const, message: `${this.type} storage credential yapılandırması gerekli.` }; }
  upload(): Promise<StorageObjectMetadata> { return this.unsupported(); }
  uploadStream(): Promise<StorageObjectMetadata> { return this.unsupported(); }
  createMultipartUpload(): Promise<MultipartUpload> { return this.unsupported(); }
  uploadPart(): Promise<{ etag: string }> { return this.unsupported(); }
  completeMultipartUpload(): Promise<StorageObjectMetadata> { return this.unsupported(); }
  abortMultipartUpload(): Promise<void> { return this.unsupported(); }
  getObject(): Promise<Uint8Array> { return this.unsupported(); }
  getStream(): Promise<Readable> { return this.unsupported(); }
  deleteObject(): Promise<void> { return this.unsupported(); }
  objectExists(): Promise<boolean> { return this.unsupported(); }
  copyObject(): Promise<StorageObjectMetadata> { return this.unsupported(); }
  moveObject(): Promise<StorageObjectMetadata> { return this.unsupported(); }
  getMetadata(): Promise<StorageObjectMetadata> { return this.unsupported(); }
  createSignedUploadUrl(): Promise<string> { return this.unsupported(); }
  createSignedDownloadUrl(): Promise<string> { return this.unsupported(); }
  getPublicUrl() { return null; }
  supportsCapability() { return false; }
  normalizeError(error: unknown) { return error instanceof Error ? error : new Error(`${this.type} storage işlemi başarısız oldu.`); }

  private unsupported(): never {
    throw new Error(`${this.type} storage yapılandırması gerekli.`);
  }
}
