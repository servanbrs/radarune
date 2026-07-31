import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/prisma";
import { authenticatePublicRequest, publicApiError } from "@/features/platform/server/http/public-api";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  let access: Awaited<ReturnType<typeof authenticatePublicRequest>> | null = null;
  try {
    access = await authenticatePublicRequest(request, "tracks.read");
    const { id } = await context.params;
    const track = await prisma.track.findFirst({ where: { id, organizationId: access.tenant.id, release: { status: { in: ["DISTRIBUTED", "LIVE"] } } }, select: { id: true, title: true, versionTitle: true, trackNumber: true, discNumber: true, language: true, explicit: true, instrumental: true, isrc: true, durationMs: true, release: { select: { id: true, title: true, type: true } }, artists: { select: { role: true, artist: { select: { id: true, name: true, slug: true } } } } } });
    if (!track) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Parça bulunamadı.", requestId: access.requestId } }, { status: 404 });
    return NextResponse.json({ data: track, meta: { requestId: access.requestId } });
  } catch (error) {
    return publicApiError(error, access?.requestId);
  }
}
