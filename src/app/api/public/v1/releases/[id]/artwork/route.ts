import { prisma } from "@/server/prisma/prisma";
import { storageService } from "@/features/storage/server/services/storage.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isTrustedThumbnailUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return (
      hostname === "i.ytimg.com" ||
      hostname.endsWith(".ytimg.com") ||
      hostname === "img.youtube.com" ||
      hostname === "i.scdn.co" ||
      hostname.endsWith(".spotifycdn.com")
    );
  } catch {
    return false;
  }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const release = await prisma.release.findFirst({
      where: { id, status: { in: ["APPROVED", "DISTRIBUTED", "LIVE"] } },
      select: {
        artworkUploadId: true,
        externalMediaSources: {
          where: { status: "ACTIVE", thumbnailUrl: { not: null } },
          orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
          take: 5,
          select: { thumbnailUrl: true },
        },
      },
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
          { track: { releaseId: id } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, storageKey: true, mimeType: true },
    });

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
            "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
            "X-Content-Type-Options": "nosniff",
          },
        });
      } catch {
        // Seçili dosya silinmişse, sıradaki geçerli artwork kaydını dene.
      }
    }

    // Imported releases can still have a provider thumbnail even when an
    // old local upload was removed during deployment. Use only HTTPS image
    // URLs saved by the import pipeline; never proxy arbitrary user input.
    const fallbackThumbnail = release.externalMediaSources
      .map((source) => source.thumbnailUrl)
      .find((url): url is string => Boolean(url && isTrustedThumbnailUrl(url)));

    if (fallbackThumbnail) {
      return Response.redirect(fallbackThumbnail, 307);
    }

    return Response.json(
      { error: "Kapak dosyası depolamada bulunamadı." },
      {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Kapak okunamadı." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }
}
