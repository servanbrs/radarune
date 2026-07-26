import "server-only";
import { Readable } from "node:stream";
import { prisma } from "@/server/prisma/prisma";
import { storageService } from "@/features/storage/server/services/storage.service";

export class PrivateStorageService {
  async getStream(input: { organizationId: string; userId: string; uploadId: string; rangeHeader?: string; canViewAll: boolean }) {
    const upload = await prisma.upload.findFirst({
      where: {
        id: input.uploadId,
        organizationId: input.organizationId,
        ...(input.canViewAll ? {} : { ownerUserId: input.userId }),
      },
      select: { storageKey: true, mimeType: true, byteSize: true, fileName: true },
    });
    if (!upload) throw new Error("Dosya bulunamadı veya erişim izniniz yok.");
    const size = Number(upload.byteSize);
    if (!Number.isSafeInteger(size)) throw new Error("Dosya boyutu güvenli aralıkta değil.");
    const adapter = storageService.getAdapter();
    const range = parseRangeHeader(input.rangeHeader, size);
    const start = range?.start ?? 0;
    const end = range?.end ?? size - 1;
    if (start < 0 || start >= size || end < start) throw new Error("Geçersiz Range isteği.");
    const stream = await adapter.getStream(upload.storageKey, { start, end });
    return {
      body: Readable.toWeb(stream) as unknown as BodyInit,
      contentType: upload.mimeType,
      fileName: upload.fileName,
      size,
      start,
      end,
      partial: Boolean(range),
    };
  }
}

function parseRangeHeader(header: string | undefined, size: number): { start: number; end: number } | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2])) throw new Error("Geçersiz Range isteği.");
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= size) {
    throw new Error("Geçersiz Range isteği.");
  }
  return { start, end: Math.min(end, size - 1) };
}

export const privateStorageService = new PrivateStorageService();
