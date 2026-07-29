import "server-only";

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, CopyObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "node:stream";
import { env } from "@/lib/env";
import type { MultipartUpload, StorageCapability, StorageConfigurationResult, StorageObjectMetadata, StorageProviderAdapter, StorageStreamUploadInput, StorageUploadInput, StorageProviderType } from "@/features/storage/domain/storage-provider";

export class S3CompatibleStorageAdapter implements StorageProviderAdapter {
  constructor(readonly type: Exclude<StorageProviderType, "LOCAL">) {}

  private config() {
    return { endpoint: env.STORAGE_S3_ENDPOINT, region: env.STORAGE_S3_REGION, bucket: env.STORAGE_S3_BUCKET, accessKeyId: env.STORAGE_S3_ACCESS_KEY_ID, secretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY };
  }

  private client() {
    const config = this.config();
    return new S3Client({
      region: config.region,
      forcePathStyle: env.STORAGE_S3_FORCE_PATH_STYLE,
      ...(config.endpoint ? { endpoint: config.endpoint } : {}),
      ...(config.accessKeyId && config.secretAccessKey
        ? { credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } }
        : {}),
    });
  }

  validateConfiguration(): StorageConfigurationResult {
    const config = this.config();
    const missing = [!config.bucket ? "STORAGE_S3_BUCKET" : null, !config.accessKeyId ? "STORAGE_S3_ACCESS_KEY_ID" : null, !config.secretAccessKey ? "STORAGE_S3_SECRET_ACCESS_KEY" : null].filter((value): value is string => Boolean(value));
    return missing.length ? { configured: false, code: "CONFIGURATION_REQUIRED", missingFields: missing } : { configured: true };
  }

  async testConnection() {
    const status = this.validateConfiguration();
    if (!status.configured) return { success: false as const, message: `Storage yapılandırması gerekli: ${status.missingFields.join(", ")}` };
    try { await this.client().send(new HeadObjectCommand({ Bucket: this.config().bucket, Key: ".radarune-health" })); return { success: true as const, checkedAt: new Date() }; }
    catch (error) { const message = error instanceof Error ? error.message : `${this.type} bağlantısı başarısız.`; if (message.includes("NotFound") || message.includes("404")) return { success: true as const, checkedAt: new Date() }; return { success: false as const, message }; }
  }

  async upload(input: StorageUploadInput) { await this.client().send(new PutObjectCommand({ Bucket: this.config().bucket, Key: input.key, Body: input.body, ContentType: input.contentType })); return this.metadata(input.key, input.contentType, input.body.byteLength); }
  async uploadStream(input: StorageStreamUploadInput) { const chunks: Uint8Array[] = []; for await (const chunk of input.stream) chunks.push(chunk); return this.upload({ key: input.key, contentType: input.contentType, body: Buffer.concat(chunks) }); }
  async createMultipartUpload(input: { key: string; contentType: string }) { const result = await this.client().send(new CreateMultipartUploadCommand({ Bucket: this.config().bucket, Key: input.key, ContentType: input.contentType })); if (!result.UploadId) throw new Error("Multipart upload başlatılamadı."); return { uploadId: result.UploadId, key: input.key }; }
  async uploadPart(input: { uploadId: string; key: string; partNumber: number; body: Uint8Array }) { const result = await this.client().send(new UploadPartCommand({ Bucket: this.config().bucket, Key: input.key, UploadId: input.uploadId, PartNumber: input.partNumber, Body: input.body })); return { etag: result.ETag ?? "" }; }
  async completeMultipartUpload(input: { uploadId: string; key: string; parts: Array<{ partNumber: number; etag: string }> }) { await this.client().send(new CompleteMultipartUploadCommand({ Bucket: this.config().bucket, Key: input.key, UploadId: input.uploadId, MultipartUpload: { Parts: input.parts.map((part) => ({ PartNumber: part.partNumber, ETag: part.etag })) } })); return this.metadata(input.key, "application/octet-stream", 0); }
  async abortMultipartUpload(input: { uploadId: string; key: string }) { await this.client().send(new AbortMultipartUploadCommand({ Bucket: this.config().bucket, Key: input.key, UploadId: input.uploadId })); }
  async getObject(key: string) { const result = await this.client().send(new GetObjectCommand({ Bucket: this.config().bucket, Key: key })); return result.Body ? new Uint8Array(await result.Body.transformToByteArray()) : new Uint8Array(); }
  async getStream(key: string, range?: { start: number; end?: number }) { const result = await this.client().send(new GetObjectCommand({ Bucket: this.config().bucket, Key: key, ...(range ? { Range: `bytes=${range.start}-${range.end ?? ""}` } : {}) })); return Readable.from(result.Body ? Buffer.from(await result.Body.transformToByteArray()) : []); }
  async deleteObject(key: string) { await this.client().send(new DeleteObjectCommand({ Bucket: this.config().bucket, Key: key })); }
  async objectExists(key: string) { try { await this.client().send(new HeadObjectCommand({ Bucket: this.config().bucket, Key: key })); return true; } catch { return false; } }
  async copyObject(input: { sourceKey: string; destinationKey: string }) { await this.client().send(new CopyObjectCommand({ Bucket: this.config().bucket, CopySource: `${this.config().bucket}/${input.sourceKey}`, Key: input.destinationKey })); return this.metadata(input.destinationKey, "application/octet-stream", 0); }
  async moveObject(input: { sourceKey: string; destinationKey: string }) { const result = await this.copyObject(input); await this.deleteObject(input.sourceKey); return result; }
  async getMetadata(key: string) { const result = await this.client().send(new HeadObjectCommand({ Bucket: this.config().bucket, Key: key })); return this.metadata(key, result.ContentType ?? "application/octet-stream", Number(result.ContentLength ?? 0), result.ETag, result.LastModified); }
  async createSignedUploadUrl(input: { key: string; expiresInSeconds: number }) { return getSignedUrl(this.client(), new PutObjectCommand({ Bucket: this.config().bucket, Key: input.key }), { expiresIn: Math.min(input.expiresInSeconds, 86_400) }); }
  async createSignedDownloadUrl(input: { key: string; expiresInSeconds: number }) { return getSignedUrl(this.client(), new GetObjectCommand({ Bucket: this.config().bucket, Key: input.key }), { expiresIn: Math.min(input.expiresInSeconds, 86_400) }); }
  getPublicUrl(key: string) { const base = env.STORAGE_S3_PUBLIC_BASE_URL ?? env.STORAGE_PUBLIC_BASE_URL; return base ? `${base.replace(/\/$/, "")}/${key}` : null; }
  supportsCapability(capability: StorageCapability) { return new Set<StorageCapability>(["PUBLIC_FILES", "PRIVATE_FILES", "SIGNED_UPLOAD", "SIGNED_DOWNLOAD", "MULTIPART_UPLOAD", "STREAMING", "CDN"]).has(capability); }
  normalizeError(error: unknown) { return error instanceof Error ? error : new Error(`${this.type} storage işlemi başarısız oldu.`); }
  private metadata(key: string, contentType: string, byteSize: number, etag?: string, lastModified?: Date) { return { key, contentType, byteSize, ...(etag ? { etag } : {}), ...(lastModified ? { lastModified } : {}) }; }
}
