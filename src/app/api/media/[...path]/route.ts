import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { storageService } from "@/features/storage/server/services/storage.service";

const allowedRoots = ["public/artists/", "public/branding/"];

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;
    const key = path.join("/");
    if (path.some((segment) => segment === "." || segment === "..") || !allowedRoots.some((root) => key.startsWith(root))) return NextResponse.json({ error: "Medya bulunamadı." }, { status: 404 });
    const adapter = storageService.getAdapter();
    const metadata = await adapter.getMetadata(key);
    const stream = await adapter.getStream(key);
    return new NextResponse(Readable.toWeb(stream) as unknown as BodyInit, {
      headers: {
        "Content-Type": metadata.contentType,
        "Content-Length": String(metadata.byteSize),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Medya bulunamadı." }, { status: 404 });
  }
}
