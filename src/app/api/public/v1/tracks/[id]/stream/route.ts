import { Readable } from "node:stream";
import { prisma } from "@/server/prisma/prisma";
import { storageService } from "@/features/storage/server/services/storage.service";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const track = await prisma.track.findFirst({ where: { id, release: { status: { in: ["APPROVED", "DISTRIBUTED", "LIVE"] } } }, select: { audioUploadId: true, uploads: { select: { id: true, storageKey: true, mimeType: true, byteSize: true, fileName: true }, where: { status: "READY" } } } });
    const upload = track?.uploads.find((entry) => entry.id === track.audioUploadId) ?? track?.uploads[0];
    if (!upload) return Response.json({ error: "Ses dosyası bulunamadı." }, { status: 404 });
    const size = Number(upload.byteSize);
    const range = parseRange(request.headers.get("range"), size);
    const start = range?.start ?? 0;
    const end = range?.end ?? size - 1;
    const stream = await storageService.getAdapter().getStream(upload.storageKey, { start, end });
    const headers = new Headers({ "Content-Type": upload.mimeType || "audio/mpeg", "Accept-Ranges": "bytes", "Content-Length": String(end - start + 1), "Cache-Control": "public, max-age=3600" });
    if (range) { headers.set("Content-Range", `bytes ${start}-${end}/${size}`); return new Response(Readable.toWeb(stream) as unknown as BodyInit, { status: 206, headers }); }
    return new Response(Readable.toWeb(stream) as unknown as BodyInit, { headers });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Ses dosyası okunamadı." }, { status: 422 });
  }
}

function parseRange(header: string | null, size: number) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) return null;
  return { start, end: Math.min(end, size - 1) };
}
