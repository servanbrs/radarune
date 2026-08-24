import "server-only";

import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { env } from "@/lib/env";
import { localStorageAdapter } from "@/features/storage/server/adapters/local-storage.adapter";
import type {
  MultipartUpload,
  StorageCapability,
  StorageConfigurationResult,
  StorageObjectMetadata,
  StorageProviderAdapter,
  StorageStreamUploadInput,
  StorageUploadInput,
} from "@/features/storage/domain/storage-provider";

/**
 * Supabase Storage's HTTP API keeps media independent from the SQL database.
 * This adapter intentionally uses fetch instead of the browser SDK so it can
 * serve private audio/artwork from server routes without exposing a service key.
 */
export class SupabaseStorageAdapter implements StorageProviderAdapter {
  readonly type = "SUPABASE_STORAGE" as const;

  private config() {
    return {
      url: env.SUPABASE_URL?.replace(/\/$/, ""),
      bucket: env.SUPABASE_STORAGE_BUCKET,
      serviceKey: env.SUPABASE_SERVICE_ROLE_KEY,
    };
  }

  private objectUrl(key: string) {
    const config = this.config();
    return `${config.url}/storage/v1/object/${encodeURIComponent(config.bucket ?? "")}/${key
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
  }

  private headers(contentType?: string) {
    const config = this.config();
    return {
      Authorization: `Bearer ${config.serviceKey ?? ""}`,
      apikey: config.serviceKey ?? "",
      ...(contentType ? { "Content-Type": contentType } : {}),
    };
  }

  validateConfiguration(): StorageConfigurationResult {
    const config = this.config();
    const missing = [
      !config.url ? "SUPABASE_URL" : null,
      !config.serviceKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
      !config.bucket ? "SUPABASE_STORAGE_BUCKET" : null,
    ].filter((value): value is string => Boolean(value));
    return missing.length
      ? { configured: false, code: "CONFIGURATION_REQUIRED", missingFields: missing }
      : { configured: true };
  }

  async testConnection() {
    const configuration = this.validateConfiguration();
    if (!configuration.configured) {
      return {
        success: false as const,
        message: `Supabase Storage yapılandırması gerekli: ${configuration.missingFields.join(", ")}`,
      };
    }
    try {
      const response = await fetch(`${this.config().url}/storage/v1/bucket`, {
        headers: this.headers(),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Supabase Storage bağlantısı başarısız (${response.status}).`);
      return { success: true as const, checkedAt: new Date() };
    } catch (error) {
      return { success: false as const, message: this.normalizeError(error).message };
    }
  }

  async upload(input: StorageUploadInput) {
    const response = await fetch(this.objectUrl(input.key), {
      method: "POST",
      headers: { ...this.headers(input.contentType), "x-upsert": "true" },
      body: Buffer.from(input.body),
    });
    await this.assertOk(response, "Dosya Supabase Storage'a yüklenemedi.");
    return this.metadata(input.key, input.contentType, input.body.byteLength);
  }

  async uploadStream(input: StorageStreamUploadInput) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of input.stream) chunks.push(chunk);
    return this.upload({ key: input.key, contentType: input.contentType, body: Buffer.concat(chunks) });
  }

  createMultipartUpload(): Promise<MultipartUpload> {
    throw new Error("Supabase Storage multipart upload bu akışta desteklenmiyor.");
  }
  uploadPart(): Promise<{ etag: string }> {
    throw new Error("Supabase Storage multipart upload bu akışta desteklenmiyor.");
  }
  completeMultipartUpload(): Promise<StorageObjectMetadata> {
    throw new Error("Supabase Storage multipart upload bu akışta desteklenmiyor.");
  }
  abortMultipartUpload(): Promise<void> {
    throw new Error("Supabase Storage multipart upload bu akışta desteklenmiyor.");
  }

  async getObject(key: string) {
    const response = await fetch(this.objectUrl(key), { headers: this.headers(), cache: "no-store" });
    if (response.status === 404) return localStorageAdapter.getObject(key);
    await this.assertOk(response, "Dosya Supabase Storage'da bulunamadı.");
    return new Uint8Array(await response.arrayBuffer());
  }

  async getStream(key: string, range?: { start: number; end?: number }) {
    const response = await fetch(this.objectUrl(key), {
      headers: {
        ...this.headers(),
        ...(range ? { Range: `bytes=${range.start}-${range.end ?? ""}` } : {}),
      },
      cache: "no-store",
    });
    if (response.status === 404) return localStorageAdapter.getStream(key, range);
    await this.assertOk(response, "Ses dosyası Supabase Storage'da bulunamadı.");
    return response.body ? Readable.fromWeb(response.body as NodeReadableStream) : Readable.from([]);
  }

  async deleteObject(key: string) {
    const response = await fetch(this.objectUrl(key), { method: "DELETE", headers: this.headers() });
    await this.assertOk(response, "Dosya Supabase Storage'dan silinemedi.");
  }

  async objectExists(key: string) {
    const response = await fetch(this.objectUrl(key), { method: "HEAD", headers: this.headers(), cache: "no-store" });
    return response.ok || (response.status === 404 && (await localStorageAdapter.objectExists(key)));
  }

  async copyObject(input: { sourceKey: string; destinationKey: string }) {
    const config = this.config();
    const response = await fetch(`${config.url}/storage/v1/object/move`, {
      method: "POST",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ bucketId: config.bucket, sourceKey: input.sourceKey, destinationKey: input.destinationKey }),
    });
    await this.assertOk(response, "Dosya Supabase Storage içinde kopyalanamadı.");
    return this.getMetadata(input.destinationKey);
  }

  async moveObject(input: { sourceKey: string; destinationKey: string }) {
    const metadata = await this.copyObject(input);
    await this.deleteObject(input.sourceKey);
    return metadata;
  }

  async getMetadata(key: string) {
    const response = await fetch(this.objectUrl(key), { method: "HEAD", headers: this.headers(), cache: "no-store" });
    if (response.status === 404) return localStorageAdapter.getMetadata(key);
    await this.assertOk(response, "Dosya bilgisi Supabase Storage'dan alınamadı.");
    return this.metadata(
      key,
      response.headers.get("content-type") ?? "application/octet-stream",
      Number(response.headers.get("content-length") ?? 0),
      response.headers.get("etag") ?? undefined,
      response.headers.get("last-modified") ? new Date(response.headers.get("last-modified")!) : undefined,
    );
  }

  async createSignedUploadUrl(input: { key: string; expiresInSeconds: number }) {
    const config = this.config();
    const response = await fetch(`${config.url}/storage/v1/object/upload/sign/${encodeURIComponent(config.bucket ?? "")}/${input.key.split("/").map(encodeURIComponent).join("/")}`, {
      method: "POST",
      headers: this.headers(),
    });
    await this.assertOk(response, "Supabase yükleme bağlantısı oluşturulamadı.");
    const body = (await response.json()) as { signedURL?: string };
    if (!body.signedURL) throw new Error("Supabase imzalı yükleme bağlantısı boş döndü.");
    return body.signedURL.startsWith("http") ? body.signedURL : `${config.url}${body.signedURL}`;
  }

  async createSignedDownloadUrl(input: { key: string; expiresInSeconds: number }) {
    const config = this.config();
    const response = await fetch(`${config.url}/storage/v1/object/sign/${encodeURIComponent(config.bucket ?? "")}/${input.key.split("/").map(encodeURIComponent).join("/")}`, {
      method: "POST",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: Math.min(Math.max(input.expiresInSeconds, 1), 86_400) }),
    });
    await this.assertOk(response, "Supabase indirme bağlantısı oluşturulamadı.");
    const body = (await response.json()) as { signedURL?: string };
    if (!body.signedURL) throw new Error("Supabase imzalı indirme bağlantısı boş döndü.");
    return body.signedURL.startsWith("http") ? body.signedURL : `${config.url}${body.signedURL}`;
  }

  getPublicUrl(key: string) {
    const config = this.config();
    if (!config.url || !config.bucket) return null;
    return `${config.url}/storage/v1/object/public/${encodeURIComponent(config.bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }

  supportsCapability(capability: StorageCapability) {
    return new Set<StorageCapability>(["PRIVATE_FILES", "SIGNED_UPLOAD", "SIGNED_DOWNLOAD", "STREAMING", "CDN"]).has(capability);
  }

  normalizeError(error: unknown) {
    return error instanceof Error ? error : new Error("Supabase Storage işlemi başarısız oldu.");
  }

  private async assertOk(response: Response, fallback: string) {
    if (response.ok) return;
    const detail = await response.text().catch(() => "");
    throw new Error(detail ? `${fallback} ${detail.slice(0, 240)}` : `${fallback} (${response.status}).`);
  }

  private metadata(key: string, contentType: string, byteSize: number, etag?: string, lastModified?: Date) {
    return { key, contentType, byteSize, ...(etag ? { etag } : {}), ...(lastModified ? { lastModified } : {}) };
  }
}

export const supabaseStorageAdapter = new SupabaseStorageAdapter();
