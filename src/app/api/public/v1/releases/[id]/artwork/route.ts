import { Readable } from "node:stream";
import { prisma } from "@/server/prisma/prisma";
import { storageService } from "@/features/storage/server/services/storage.service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const release = await prisma.release.findFirst({
      where: { id, status: { in: ["APPROVED", "DISTRIBUTED", "LIVE"] } },
      select: {
        artworkUploadId: true,
        uploads: { select: { id: true, storageKey: true, mimeType: true, byteSize: true, kind: true, status: true } },
      },
    });
    const upload = release?.uploads.find((item) => item.id === release.artworkUploadId && item.kind === "ARTWORK")
      ?? release?.uploads.find((item) => item.status === "READY" && item.kind === "ARTWORK");
    if (!upload) return Response.json({ error: "Kapak görseli bulunamadı." }, { status: 404 });
    const size = Number(upload.byteSize);
    if (!Number.isSafeInteger(size) || size <= 0) return Response.json({ error: "Kapak boyutu geçersiz." }, { status: 422 });
    const stream = await storageService.getAdapter().getStream(upload.storageKey, { start: 0, end: size - 1 });
    return new Response(Readable.toWeb(stream) as unknown as BodyInit, {
      headers: { "Content-Type": upload.mimeType || "image/jpeg", "Content-Length": String(size), "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Kapak okunamadı." }, { status: 422 });
  }
}
