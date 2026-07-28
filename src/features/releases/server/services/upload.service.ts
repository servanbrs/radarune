import "server-only";
import { createHash, randomUUID } from "node:crypto";
import {
  acceptedArtworkMimeTypes,
  acceptedAudioMimeTypes,
  maxArtworkFileBytes,
  maxAudioFileBytes,
  minArtworkPixels,
} from "@/features/releases/constants/release.constants";
import { readImageDimensions } from "@/features/releases/server/lib/image-dimensions";
import { uploadRepository } from "@/features/releases/server/repositories/upload.repository";
import { storageService } from "@/features/storage/server/services/storage.service";

type StoreUploadInput = {
  organizationId: string;
  ownerUserId: string;
  file: File;
  kind: "AUDIO" | "ARTWORK" | "VIDEO";
};

export class UploadService {
  async storeUpload(input: StoreUploadInput) {
    const mimeType = input.file.type;

    if (input.kind === "AUDIO") {
      this.assertAudioFileMetadata(input.file);
      return this.storeAudioUpload(input);
    }

    if (input.kind === "VIDEO") {
      return this.storeVideoUpload(input);
    }

    const buffer = Buffer.from(await input.file.arrayBuffer());
    this.assertArtworkFile(input.file, buffer);
    const checksumSha256 = createHash("sha256").update(buffer).digest("hex");
    const extension = mimeType.includes("png") ? "png" : "jpg";
    const storageKey = `private/uploads/${input.organizationId}/${input.kind.toLowerCase()}/${randomUUID()}.${extension}`;
    await storageService.getAdapter().upload({ key: storageKey, contentType: mimeType, body: buffer });

    const dimensions = input.kind === "ARTWORK" ? readImageDimensions(buffer, mimeType) : null;

    return uploadRepository.create({
      organizationId: input.organizationId,
      ownerUserId: input.ownerUserId,
      kind: input.kind,
      fileName: input.file.name,
      mimeType,
      byteSize: BigInt(buffer.byteLength),
      storageKey,
      checksumSha256,
      ...(dimensions ? { width: dimensions.width, height: dimensions.height } : {}),
    });
  }

  private async storeVideoUpload(input: StoreUploadInput) {
    const mimeType = input.file.type;
    if (!mimeType.startsWith("video/") || !/\.(mp4|mov|webm)$/i.test(input.file.name)) {
      throw new Error("Klip dosyası MP4, MOV veya WebM formatında olmalıdır.");
    }
    const buffer = Buffer.from(await input.file.arrayBuffer());
    if (buffer.byteLength > maxAudioFileBytes * 4) {
      throw new Error("Klip dosyası izin verilen maksimum boyutu aşıyor.");
    }
    const checksumSha256 = createHash("sha256").update(buffer).digest("hex");
    const extension = input.file.name.split(".").pop()?.toLowerCase() ?? "mp4";
    const storageKey = `private/uploads/${input.organizationId}/video/${randomUUID()}.${extension}`;
    await storageService.getAdapter().upload({ key: storageKey, contentType: mimeType, body: buffer });
    return uploadRepository.create({ organizationId: input.organizationId, ownerUserId: input.ownerUserId, kind: "VIDEO", fileName: input.file.name, mimeType, byteSize: BigInt(buffer.byteLength), storageKey, checksumSha256 });
  }

  private async storeAudioUpload(input: StoreUploadInput) {
    const storageKey = `private/uploads/${input.organizationId}/audio/${randomUUID()}.${input.file.type.includes("flac") ? "flac" : "wav"}`;
    const state = { byteSize: 0, prefix: Buffer.alloc(0), hash: createHash("sha256") };
    const adapter = storageService.getAdapter();

    try {
      await adapter.uploadStream({
        key: storageKey,
        contentType: input.file.type,
        stream: this.createAudioStream(input.file, state),
      });
      this.assertAudioSignature(state.prefix);
    } catch (error) {
      await adapter.deleteObject(storageKey).catch(() => undefined);
      throw error;
    }

    return uploadRepository.create({
      organizationId: input.organizationId,
      ownerUserId: input.ownerUserId,
      kind: "AUDIO",
      fileName: input.file.name,
      mimeType: input.file.type,
      byteSize: BigInt(state.byteSize),
      storageKey,
      checksumSha256: state.hash.digest("hex"),
    });
  }

  private async *createAudioStream(file: File, state: { byteSize: number; prefix: Buffer; hash: ReturnType<typeof createHash> }) {
    const reader = file.stream().getReader();
    try {
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        const chunk = Buffer.from(result.value);
        state.byteSize += chunk.byteLength;
        if (state.byteSize > maxAudioFileBytes) {
          throw new Error("Ses dosyası izin verilen maksimum boyutu aşıyor.");
        }
        if (state.prefix.byteLength < 12) {
          state.prefix = Buffer.concat([state.prefix, chunk]).subarray(0, 12);
        }
        state.hash.update(chunk);
        yield chunk;
      }
    } finally {
      reader.releaseLock();
    }
  }

  private assertAudioFileMetadata(file: File) {
    const lowerName = file.name.toLowerCase();
    const validExtension = lowerName.endsWith(".wav") || lowerName.endsWith(".flac");
    if (!acceptedAudioMimeTypes.includes(file.type as (typeof acceptedAudioMimeTypes)[number]) || !validExtension) {
      throw new Error("Ses dosyası WAV veya FLAC formatında olmalıdır.");
    }
  }

  private assertAudioSignature(prefix: Buffer) {
    const isWav = prefix.byteLength >= 12 && prefix.subarray(0, 4).toString("ascii") === "RIFF" && prefix.subarray(8, 12).toString("ascii") === "WAVE";
    const isFlac = prefix.subarray(0, 4).toString("ascii") === "fLaC";
    if (!isWav && !isFlac) {
      throw new Error("Ses dosyasının WAV veya FLAC imzası doğrulanamadı.");
    }
  }

  private assertArtworkFile(file: File, buffer: Buffer) {
    const lowerName = file.name.toLowerCase();
    const validExtension = lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".png");
    if (!acceptedArtworkMimeTypes.includes(file.type as (typeof acceptedArtworkMimeTypes)[number]) || !validExtension) {
      throw new Error("Kapak görseli JPG veya PNG formatında olmalıdır.");
    }

    if (buffer.byteLength > maxArtworkFileBytes) {
      throw new Error("Kapak görseli en fazla 20 MB olabilir.");
    }

    const dimensions = readImageDimensions(buffer, file.type);
    if (!dimensions) {
      throw new Error("Kapak görselinin boyutları doğrulanamadı.");
    }

    if (dimensions.width !== dimensions.height) {
      throw new Error("Kapak görseli kare formatta olmalıdır.");
    }

    if (dimensions.width < minArtworkPixels || dimensions.height < minArtworkPixels) {
      throw new Error("Kapak görseli en az 3000 x 3000 piksel olmalıdır.");
    }
  }

}

export const uploadService = new UploadService();
