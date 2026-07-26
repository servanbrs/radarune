import type { Readable } from "node:stream";

export const storageProviderTypes = [
  "LOCAL",
  "S3",
  "S3_COMPATIBLE",
  "CLOUDFLARE_R2",
  "DIGITALOCEAN_SPACES",
  "MINIO",
  "SUPABASE_STORAGE",
  "AZURE_BLOB",
  "GOOGLE_CLOUD_STORAGE",
] as const;

export type StorageProviderType = (typeof storageProviderTypes)[number];

export const storageCapabilities = [
  "LOCAL_FILESYSTEM",
  "PUBLIC_FILES",
  "PRIVATE_FILES",
  "SIGNED_UPLOAD",
  "SIGNED_DOWNLOAD",
  "MULTIPART_UPLOAD",
  "STREAMING",
  "CDN",
  "OBJECT_VERSIONING",
] as const;

export type StorageCapability = (typeof storageCapabilities)[number];

export type StorageConfigurationResult =
  | { configured: true }
  | { configured: false; code: "CONFIGURATION_REQUIRED"; missingFields: string[] };

export type StorageObjectMetadata = {
  key: string;
  contentType: string;
  byteSize: number;
  etag?: string;
  lastModified?: Date;
};

export type StorageUploadInput = {
  key: string;
  contentType: string;
  body: Uint8Array;
};

export type StorageStreamUploadInput = {
  key: string;
  contentType: string;
  stream: AsyncIterable<Uint8Array>;
};

export type MultipartUpload = {
  uploadId: string;
  key: string;
};

export type StorageProviderAdapter = {
  readonly type: StorageProviderType;
  validateConfiguration(): StorageConfigurationResult;
  testConnection(): Promise<{ success: true; checkedAt: Date } | { success: false; message: string }>;
  upload(input: StorageUploadInput): Promise<StorageObjectMetadata>;
  uploadStream(input: StorageStreamUploadInput): Promise<StorageObjectMetadata>;
  createMultipartUpload(input: { key: string; contentType: string }): Promise<MultipartUpload>;
  uploadPart(input: { uploadId: string; key: string; partNumber: number; body: Uint8Array }): Promise<{ etag: string }>;
  completeMultipartUpload(input: { uploadId: string; key: string; parts: Array<{ partNumber: number; etag: string }> }): Promise<StorageObjectMetadata>;
  abortMultipartUpload(input: { uploadId: string; key: string }): Promise<void>;
  getObject(key: string): Promise<Uint8Array>;
  getStream(key: string, range?: { start: number; end?: number }): Promise<Readable>;
  deleteObject(key: string): Promise<void>;
  objectExists(key: string): Promise<boolean>;
  copyObject(input: { sourceKey: string; destinationKey: string }): Promise<StorageObjectMetadata>;
  moveObject(input: { sourceKey: string; destinationKey: string }): Promise<StorageObjectMetadata>;
  getMetadata(key: string): Promise<StorageObjectMetadata>;
  createSignedUploadUrl(input: { key: string; expiresInSeconds: number }): Promise<string>;
  createSignedDownloadUrl(input: { key: string; expiresInSeconds: number }): Promise<string>;
  getPublicUrl(key: string): string | null;
  supportsCapability(capability: StorageCapability): boolean;
  normalizeError(error: unknown): Error;
};
