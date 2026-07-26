import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/prisma";
import { authenticatePublicRequest, pagination, publicApiError } from "@/features/platform/server/http/public-api";
import { apiKeyService } from "@/features/platform/server/services/api-key.service";

export async function GET(request: Request) {
  const startedAt = Date.now();
  let access: Awaited<ReturnType<typeof authenticatePublicRequest>> | null = null;
  try {
    access = await authenticatePublicRequest(request, "artists.read");
    const { page, pageSize } = pagination(request);
    const search = new URL(request.url).searchParams.get("search")?.trim();
    const where = { organizationId: access.tenant.id, ...(search ? { OR: [{ name: { contains: search } }, { slug: { contains: search } }] } : {}) };
    const [items, total] = await Promise.all([
      prisma.artist.findMany({ where, orderBy: { name: "asc" }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, name: true, slug: true, type: true, spotifyProfileUrl: true, appleMusicProfileUrl: true, createdAt: true } }),
      prisma.artist.count({ where }),
    ]);
    await apiKeyService.recordUsage({ apiKeyId: access.key.id, organizationId: access.tenant.id, requestId: access.requestId, method: "GET", path: "/api/public/v1/artists", statusCode: 200, responseTimeMs: Date.now() - startedAt });
    return NextResponse.json({ data: items, meta: { page, pageSize, total, requestId: access.requestId } });
  } catch (error) {
    return publicApiError(error, access?.requestId);
  }
}
