import { NextResponse } from "next/server";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { prisma } from "@/server/prisma/prisma";

export async function GET(request: Request) {
  try {
    const { organization } = await authSessionService.getDashboardContext();
    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return NextResponse.json({ artists: [], releases: [], tracks: [], imported: [] });
    const organizationId = organization.organization.id;
    const [artistsResult, releasesResult, tracksResult, importedResult] = await Promise.allSettled([
      prisma.artist.findMany({ where: { organizationId, name: { contains: q } }, take: 5, orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
      prisma.release.findMany({ where: { organizationId, status: { in: ["LIVE", "DISTRIBUTED"] }, title: { contains: q } }, take: 5, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, artists: { take: 1, select: { artist: { select: { name: true } } } } } }),
      prisma.track.findMany({ where: { organizationId, title: { contains: q }, release: { status: { in: ["LIVE", "DISTRIBUTED"] } } }, take: 5, orderBy: { title: "asc" }, select: { id: true, title: true, release: { select: { id: true, title: true } } } }),
      prisma.externalMediaSource.findMany({ where: { organizationId, status: "ACTIVE", OR: [{ title: { contains: q } }, { artistName: { contains: q } }] }, take: 5, orderBy: { createdAt: "desc" }, select: { id: true, title: true, artistName: true, externalUrl: true, provider: true, artist: { select: { slug: true } } } }),
    ]);
    const artists = artistsResult.status === "fulfilled" ? artistsResult.value : [];
    const releases = releasesResult.status === "fulfilled" ? releasesResult.value : [];
    const tracks = tracksResult.status === "fulfilled" ? tracksResult.value : [];
    const imported = importedResult.status === "fulfilled" ? importedResult.value : [];
    return NextResponse.json({ artists, releases, tracks, imported });
  } catch (error) {
    console.error("Global search failed", error);
    return NextResponse.json({ artists: [], releases: [], tracks: [], imported: [], error: "Arama şu anda kullanılamıyor." }, { status: 500 });
  }
}
