import { prisma } from "@/server/prisma/prisma";
import { storageService } from "@/features/storage/server/services/storage.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const release = await prisma.release.findFirst({
      where: { id, status: { in: ["APPROVED", "DISTRIBUTED", "LIVE"] } },
      select: { artworkUploadId: true },
    });
    if (!release) return Response.json({ error: "Yayın bulunamadı." }, { status: 404 });

    // Eski yayınlarda artworkUploadId veya Upload.releaseId tek başına eksik
    // kalabildiği için önce seçili kapağı, ardından yayına bağlı diğer
    // görselleri aday olarak deniyoruz.
    const uploads = await prisma.upload.findMany({
      where: {
        kind: "ARTWORK",
        status: { in: ["READY", "PENDING"] },
        OR: [
          ...(release.artworkUploadId ? [{ id: release.artworkUploadId }] : []),
          { releaseId: id },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, storageKey: true, mimeType: true },
    });

    if (uploads.length === 0) {
      return Response.json({ error: "Kapak görseli bulunamadı." }, { status: 404 });
    }

    const preferredUpload = release.artworkUploadId
      ? uploads.find((upload) => upload.id === release.artworkUploadId)
      : undefined;
    const candidates = preferredUpload
      ? [preferredUpload, ...uploads.filter((upload) => upload.id !== preferredUpload.id)]
      : uploads;
    const adapter = storageService.getAdapter();

    for (const upload of candidates) {
      try {
        const body = await adapter.getObject(upload.storageKey);
        if (!body.byteLength) continue;

        return new Response(Buffer.from(body), {
          headers: {
            "Content-Type": upload.mimeType?.startsWith("image/") ? upload.mimeType : "image/jpeg",
            "Content-Length": String(body.byteLength),
            "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
            "X-Content-Type-Options": "nosniff",
          },
        });
      } catch {
        // Seçili dosya silinmişse, sıradaki geçerli artwork kaydını dene.
      }
    }

    return Response.json({ error: "Kapak dosyası depolamada bulunamadı." }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Kapak okunamadı." }, { status: 422 });
  }
}
