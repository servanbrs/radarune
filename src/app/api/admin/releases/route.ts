import { NextResponse } from "next/server";
import { adminPaginationSchema } from "@/features/admin/schemas/admin.schema";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { releaseModerationService } from "@/features/admin/server/services/release-moderation.service";

export async function GET(request: Request) {
  try {
    const actor = await getAdminActor();
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const input = adminPaginationSchema.parse(params);
    const releases = await releaseModerationService.listReleases(actor, {
      page: input.page,
      pageSize: input.pageSize,
      ...(input.search ? { search: input.search } : {}),
    });
    return NextResponse.json(releases);
  } catch (error) {
    return adminJsonError(error);
  }
}
