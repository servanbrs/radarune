import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/prisma";
import { authenticatePublicRequest, publicApiError } from "@/features/platform/server/http/public-api";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  let access: Awaited<ReturnType<typeof authenticatePublicRequest>> | null = null;
  try {
    access = await authenticatePublicRequest(request, "artists.read");
    const { id } = await context.params;
    const artist = await prisma.artist.findFirst({ where: { id, organizationId: access.tenant.id }, select: { id: true, name: true, slug: true, type: true, spotifyProfileUrl: true, appleMusicProfileUrl: true, createdAt: true, releaseArtistLinks: { where: { release: { status: "LIVE" } }, select: { role: true, release: { select: { id: true, title: true, type: true, status: true } } } } } });
    if (!artist) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Sanatçı bulunamadı.", requestId: access.requestId } }, { status: 404 });
    return NextResponse.json({ data: artist, meta: { requestId: access.requestId } });
  } catch (error) {
    return publicApiError(error, access?.requestId);
  }
}
