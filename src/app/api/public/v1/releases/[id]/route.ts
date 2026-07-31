import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/prisma";
import { authenticatePublicRequest, publicApiError } from "@/features/platform/server/http/public-api";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  let access: Awaited<ReturnType<typeof authenticatePublicRequest>> | null = null;
  try {
    access = await authenticatePublicRequest(request, "releases.read");
    const { id } = await context.params;
    const release = await prisma.release.findFirst({
      where: { id, organizationId: access.tenant.id, status: { in: ["DISTRIBUTED", "LIVE"] } },
      select: {
        id: true,
        title: true,
        versionTitle: true,
        primaryLanguage: true,
        primaryGenre: true,
        secondaryGenre: true,
        type: true,
        explicit: true,
        copyrightP: true,
        copyrightC: true,
        plannedReleaseDate: true,
        originalReleaseDate: true,
        upc: true,
        liveAt: true,
        artists: { select: { role: true, artist: { select: { id: true, name: true, slug: true } } } },
        tracks: {
          orderBy: [{ discNumber: "asc" }, { trackNumber: "asc" }],
          select: {
            id: true,
            title: true,
            versionTitle: true,
            trackNumber: true,
            discNumber: true,
            language: true,
            explicit: true,
            instrumental: true,
            isrc: true,
            durationMs: true,
            artists: { select: { role: true, artist: { select: { id: true, name: true, slug: true } } } },
          },
        },
      },
    });
    if (!release) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Yayın bulunamadı.", requestId: access.requestId } }, { status: 404 });
    return NextResponse.json({ data: release, meta: { requestId: access.requestId } });
  } catch (error) {
    return publicApiError(error, access?.requestId);
  }
}
