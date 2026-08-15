import { Readable } from "node:stream";
import { unstable_cache } from "next/cache";
import { prisma } from "@/server/prisma/prisma";
import { storageService } from "@/features/storage/server/services/storage.service";

const getCachedArtwork = (releaseId: string) =>
  unstable_cache(
    async () => {
      const release = await prisma.release.findFirst({
        where: { id: releaseId, status: { in: ["APPROVED", "DISTRIBUTED", "LIVE"] } },
        select: {
          artworkUploadId: true,
          uploads: {
            where: { kind: "ARTWORK", status: "READY" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, storageKey: true, mimeType: true, byteSize: true },
          },
        },
      });

      return release
        ? {
            artworkUploadId: release.artworkUploadId,
            uploads: release.uploads.map((upload) => ({
              ...upload,
              byteSize: Number(upload.byteSize),
            })),
          }
        : null;
    },
    ["public-release-artwork", releaseId],
    { revalidate: 300 },
  )();

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const release = await getCachedArtwork(id);
    const upload = release?.uploads.find((item) => item.id === release.artworkUploadId) ?? release?.uploads[0];
    if (!upload) return Response.json({ error: "Kapak görseli bulunamadı." }, { status: 404 });
    const size = Number(upload.byteSize);
    if (!Number.isSafeInteger(size) || size <= 0) return Response.json({ error: "Kapak boyutu geçersiz." }, { status: 422 });
    const stream = await storageService.getAdapter().getStream(upload.storageKey);
    return new Response(Readable.toWeb(stream) as unknown as BodyInit, {
      headers: { "Content-Type": upload.mimeType || "image/jpeg", "Content-Length": String(size), "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Kapak okunamadı." }, { status: 422 });
  }
}
