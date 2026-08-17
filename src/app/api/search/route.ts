import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";
import { prisma } from "@/server/prisma/prisma";

const PUBLIC_RELEASE_STATUSES = ["APPROVED", "DISTRIBUTED", "LIVE"] as const;

export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return NextResponse.json({ artists: [], releases: [], tracks: [], imported: [] });
    const tenant = await tenantContextService.resolveFromRequest();
    if (!tenant) return NextResponse.json({ artists: [], releases: [], tracks: [], imported: [] });

    // Explicit collation keeps MariaDB installations with mixed column
    // collations searchable (and avoids silently returning empty results).
    const organizationFilter = Prisma.sql`AND organizationId = ${tenant.id}`;
    const releaseStatuses = Prisma.join(PUBLIC_RELEASE_STATUSES.map((status) => Prisma.sql`${status}`), ", ");
    const [artistIds, releaseIds, trackIds, importedIds] = await Promise.all([
      prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id FROM Artist WHERE 1 = 1 ${organizationFilter}
        AND CONVERT(name USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', ${q}, '%')
        ORDER BY name ASC LIMIT 5
      `),
      prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT DISTINCT r.id FROM ${Prisma.raw("`Release`")} r
        LEFT JOIN ReleaseArtist ra ON ra.releaseId = r.id
        LEFT JOIN Artist a ON a.id = ra.artistId
        WHERE r.organizationId = ${tenant.id} AND r.status IN (${releaseStatuses})
        AND (CONVERT(r.title USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', ${q}, '%')
          OR CONVERT(a.name USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', ${q}, '%'))
        LIMIT 5
      `),
      prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT DISTINCT t.id FROM Track t
        INNER JOIN ${Prisma.raw("`Release`")} r ON r.id = t.releaseId
        LEFT JOIN TrackArtist ta ON ta.trackId = t.id
        LEFT JOIN Artist a ON a.id = ta.artistId
        WHERE t.organizationId = ${tenant.id} AND r.status IN (${releaseStatuses})
        AND (CONVERT(t.title USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', ${q}, '%')
          OR CONVERT(a.name USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', ${q}, '%'))
        LIMIT 5
      `),
      prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id FROM ExternalMediaSource WHERE 1 = 1 ${organizationFilter}
        AND status = 'ACTIVE'
        AND (CONVERT(title USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', ${q}, '%')
          OR CONVERT(COALESCE(artistName, '') USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', ${q}, '%'))
        ORDER BY createdAt DESC LIMIT 5
      `),
    ]);
    const [artists, releases, tracks, imported] = await Promise.all([
      prisma.artist.findMany({ where: { id: { in: artistIds.map((row) => row.id) } }, select: { id: true, name: true, slug: true } }),
      prisma.release.findMany({ where: { id: { in: releaseIds.map((row) => row.id) } }, select: { id: true, title: true, artists: { take: 1, select: { artist: { select: { name: true } } } } } }),
      prisma.track.findMany({ where: { id: { in: trackIds.map((row) => row.id) } }, select: { id: true, title: true, release: { select: { id: true, title: true } } } }),
      prisma.externalMediaSource.findMany({ where: { id: { in: importedIds.map((row) => row.id) } }, select: { id: true, title: true, artistName: true, externalUrl: true, provider: true, artist: { select: { slug: true } } } }),
    ]);
    const sortByRank = <T extends { id: string }>(items: T[], ids: Array<{ id: string }>) => {
      const order = new Map(ids.map((row, index) => [row.id, index]));
      return items.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
    };
    return NextResponse.json({
      artists: sortByRank(artists, artistIds),
      releases: sortByRank(releases, releaseIds),
      tracks: sortByRank(tracks, trackIds),
      imported: sortByRank(imported, importedIds),
    });
  } catch (error) {
    console.error("Global search failed", error);
    return NextResponse.json({ artists: [], releases: [], tracks: [], imported: [], error: "Arama şu anda kullanılamıyor." }, { status: 500 });
  }
}
