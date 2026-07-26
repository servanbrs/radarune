import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/prisma";
import { authenticatePublicRequest, pagination, publicApiError } from "@/features/platform/server/http/public-api";

export async function GET(request: Request) {
  let access: Awaited<ReturnType<typeof authenticatePublicRequest>> | null = null;
  try {
    access = await authenticatePublicRequest(request, "releases.read");
    const { page, pageSize } = pagination(request);
    const [items, total] = await Promise.all([
      prisma.release.findMany({ where: { organizationId: access.tenant.id, status: "LIVE" }, orderBy: { liveAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, title: true, versionTitle: true, primaryLanguage: true, primaryGenre: true, type: true, explicit: true, plannedReleaseDate: true, originalReleaseDate: true, upc: true, liveAt: true, artists: { select: { role: true, artist: { select: { id: true, name: true, slug: true } } } }, _count: { select: { tracks: true } } } }),
      prisma.release.count({ where: { organizationId: access.tenant.id, status: "LIVE" } }),
    ]);
    return NextResponse.json({ data: items, meta: { page, pageSize, total, requestId: access.requestId } });
  } catch (error) {
    return publicApiError(error, access?.requestId);
  }
}
