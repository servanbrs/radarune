import { Readable } from "node:stream";
import { prisma } from "@/server/prisma/prisma";
import { storageService } from "@/features/storage/server/services/storage.service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const release = await prisma.release.findFirst({
      where: { id, status: { in: ["APPROVED", "DISTRIBUTED", "LIVE"] } },
      select: { artworkUploadId: true },
    });
    if (!release) return Response.json({ error: "Yayın bulunamadı." }, { status: 404 });

    // Önce yayın üzerinde tutulan doğrudan upload kimliğini kullan. Eski
    // kayıtlarda Upload.releaseId eksik olabildiği için yalnızca relation
    // üzerinden arama yapmak kapağın sonradan kaybolmasına neden oluyordu.
    const upload =
      (release.artworkUploadId
        ? await prisma.upload.findFirst({
            where: { id: release.artworkUploadId, kind: "ARTWORK", status: "READY" },
            select: { id: true, storageKey: true, mimeType: true, byteSize: true },
          })
        : null) ??
      (await prisma.upload.findFirst({
        where: { releaseId: id, kind: "ARTWORK", status: "READY" },
        orderBy: { createdAt: "desc" },
        select: { id: true, storageKey: true, mimeType: true, byteSize: true },
      }));

    if (!upload) return Response.json({ error: "Kapak görseli bulunamadı." }, { status: 404 });
    const size = Number(upload.byteSize);
    if (!Number.isSafeInteger(size) || size <= 0) return Response.json({ error: "Kapak boyutu geçersiz." }, { status: 422 });
    const stream = await storageService.getAdapter().getStream(upload.storageKey);
    return new Response(Readable.toWeb(stream) as unknown as BodyInit, {
      headers: {
        "Content-Type": upload.mimeType || "image/jpeg",
        "Content-Length": String(size),
        // Upload değiştiğinde yeni kapak hızlıca görünür; eski görseller de
        // tarayıcı önbelleğinde gereksiz yere bir saat tutulmaz.
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Kapak okunamadı." }, { status: 422 });
  }
}
