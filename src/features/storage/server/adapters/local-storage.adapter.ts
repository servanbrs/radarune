import "server-only";
import { createHmac } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, copyFile, mkdir, open, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import type {
  MultipartUpload,
  StorageCapability,
  StorageConfigurationResult,
  StorageObjectMetadata,
  StorageProviderAdapter,
  StorageStreamUploadInput,
  StorageUploadInput,
} from "@/features/storage/domain/storage-provider";
import { resolveStoragePath } from "@/features/storage/server/lib/storage-path";

const multipartUnsupported = () => {
  throw new Error("Local storage multipart upload desteklemiyor.");
};

export class LocalStorageAdapter implements StorageProviderAdapter {
  readonly type = "LOCAL" as const;

  private get configuredRoot() {
    // Keep the fallback relative and static so Next.js NFT does not treat the
    // entire repository as a runtime filesystem dependency.
    return path.resolve(/* turbopackIgnore: true */ env.STORAGE_LOCAL_ROOT ?? env.STORAGE_LOCAL_PATH ?? "storage");
  }

  /**
   * Deployments made before the storage root was made configurable may have
   * left artwork under the app's working directory (or its public_html
   * sibling). Read those locations as a compatibility fallback so a code
   * deployment cannot make existing covers disappear.
   */
  private get roots() {
    const candidates = [
      this.configuredRoot,
      path.resolve(/* turbopackIgnore: true */ process.cwd(), "storage"),
      path.resolve(/* turbopackIgnore: true */ process.cwd(), "../storage"),
      path.resolve(/* turbopackIgnore: true */ process.cwd(), "../public_html/storage"),
    ];

    return Array.from(new Set(candidates));
  }

  private target(root: string, key: string) {
    return resolveStoragePath(root, key);
  }

  validateConfiguration(): StorageConfigurationResult {
    if (process.env.NODE_ENV === "production" && !env.STORAGE_ALLOW_LOCAL_IN_PRODUCTION) {
      return { configured: false, code: "CONFIGURATION_REQUIRED", missingFields: ["STORAGE_ALLOW_LOCAL_IN_PRODUCTION"] };
    }
    if (process.env.NODE_ENV === "production" && !env.STORAGE_LOCAL_ROOT && !env.STORAGE_LOCAL_PATH) {
      return { configured: false, code: "CONFIGURATION_REQUIRED", missingFields: ["STORAGE_LOCAL_ROOT"] };
    }
    return { configured: true };
  }

  async testConnection() {
    const config = this.validateConfiguration();
    if (!config.configured) return { success: false as const, message: "Local storage production ortamında açıkça etkinleştirilmelidir." };
    try {
      await mkdir(this.configuredRoot, { recursive: true });
      await access(this.configuredRoot);
      return { success: true as const, checkedAt: new Date() };
    } catch (error) {
      return { success: false as const, message: this.normalizeError(error).message };
    }
  }

  async upload(input: StorageUploadInput) {
    const target = this.target(this.configuredRoot, input.key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, input.body, { flag: "wx" });
    const file = await stat(target);
    return this.metadata(input.key, input.contentType, file);
  }

  async uploadStream(input: StorageStreamUploadInput) {
    const target = this.target(this.configuredRoot, input.key);
    await mkdir(path.dirname(target), { recursive: true });
    const handle = await open(target, "wx");
    try {
      for await (const chunk of input.stream) await handle.write(Buffer.from(chunk));
    } catch (error) {
      await unlink(target).catch(() => undefined);
      throw this.normalizeError(error);
    } finally {
      await handle.close();
    }
    const file = await stat(target);
    return this.metadata(input.key, input.contentType, file);
  }

  createMultipartUpload(): Promise<MultipartUpload> { return multipartUnsupported(); }
  uploadPart(): Promise<{ etag: string }> { return multipartUnsupported(); }
  completeMultipartUpload(): Promise<StorageObjectMetadata> { return multipartUnsupported(); }
  abortMultipartUpload(): Promise<void> { return multipartUnsupported(); }

  async getObject(key: string) {
    let lastError: unknown;
    for (const root of this.roots) {
      try {
        return await readFile(this.target(root, key));
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Dosya depolamada bulunamadı.");
  }

  async getStream(key: string, range?: { start: number; end?: number }) {
    for (const root of this.roots) {
      try {
        await access(this.target(root, key));
        return createReadStream(this.target(root, key), range);
      } catch {
        // Try the next legacy storage root.
      }
    }

    throw new Error("Dosya depolamada bulunamadı.");
  }

  async deleteObject(key: string) {
    for (const root of this.roots) {
      try {
        await unlink(this.target(root, key));
        return;
      } catch {
        // Try the next legacy storage root.
      }
    }

    throw new Error("Dosya depolamada bulunamadı.");
  }

  async objectExists(key: string) {
    for (const root of this.roots) {
      try {
        await access(this.target(root, key));
        return true;
      } catch {
        // Try the next legacy storage root.
      }
    }

    return false;
  }

  async copyObject(input: { sourceKey: string; destinationKey: string }) {
    const sourceRoot = await this.findRoot(input.sourceKey);
    const source = this.target(sourceRoot, input.sourceKey);
    const destination = this.target(this.configuredRoot, input.destinationKey);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(source, destination);
    const sourceMetadata = await this.getMetadata(input.sourceKey);
    return { ...sourceMetadata, key: input.destinationKey };
  }

  async moveObject(input: { sourceKey: string; destinationKey: string }) {
    const sourceRoot = await this.findRoot(input.sourceKey);
    const source = this.target(sourceRoot, input.sourceKey);
    const destination = this.target(this.configuredRoot, input.destinationKey);
    await mkdir(path.dirname(destination), { recursive: true });
    await rename(source, destination);
    const sourceMetadata = await this.getMetadata(input.destinationKey);
    return { ...sourceMetadata, key: input.destinationKey };
  }

  async getMetadata(key: string) {
    const root = await this.findRoot(key);
    const file = await stat(this.target(root, key));
    return this.metadata(key, "application/octet-stream", file);
  }

  async createSignedUploadUrl(input: { key: string; expiresInSeconds: number }) {
    return this.signedUrl("upload", input.key, input.expiresInSeconds);
  }

  async createSignedDownloadUrl(input: { key: string; expiresInSeconds: number }) {
    return this.signedUrl("download", input.key, input.expiresInSeconds);
  }

  getPublicUrl(key: string) {
    if (!env.STORAGE_PUBLIC_BASE_URL || !key.startsWith("public/")) return null;
    return `${env.STORAGE_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
  }

  supportsCapability(capability: StorageCapability) {
    return new Set<StorageCapability>(["LOCAL_FILESYSTEM", "PRIVATE_FILES", "SIGNED_DOWNLOAD", "STREAMING"]).has(capability);
  }

  normalizeError(error: unknown) {
    return error instanceof Error ? error : new Error("Local storage işlemi başarısız oldu.");
  }

  private async findRoot(key: string) {
    for (const root of this.roots) {
      try {
        await access(this.target(root, key));
        return root;
      } catch {
        // Try the next legacy storage root.
      }
    }

    throw new Error("Dosya depolamada bulunamadı.");
  }

  private metadata(key: string, contentType: string, file?: { size: number; mtime: Date }) {
    return {
      key,
      contentType,
      byteSize: file?.size ?? 0,
      ...(file?.mtime ? { lastModified: file.mtime } : {}),
    };
  }

  private signedUrl(operation: "upload" | "download", key: string, expiresInSeconds: number) {
    const expiresAt = Math.floor(Date.now() / 1_000) + Math.max(1, Math.min(expiresInSeconds, 86_400));
    const payload = `${operation}:${key}:${expiresAt}`;
    const secret = env.STORAGE_SIGNING_SECRET ?? env.ENCRYPTION_KEY ?? env.BETTER_AUTH_SECRET;
    const signature = createHmac("sha256", secret).update(payload).digest("hex");
    return `/api/storage/${operation}?key=${encodeURIComponent(key)}&expires=${expiresAt}&signature=${signature}`;
  }
}

export const localStorageAdapter = new LocalStorageAdapter();
