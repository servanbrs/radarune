import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { siteBuilderService } from "@/features/platform/server/services/site-builder.service";
import type { SitePageUpdateInput } from "@/features/platform/schemas/platform.schema";

export async function GET() {
  try {
    const actor = await getAdminActor();
    return NextResponse.json(await siteBuilderService.getHomepageForAdmin(actor));
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await getAdminActor();
    const body: unknown = await request.json();
    return NextResponse.json(await siteBuilderService.updateHomepage(actor, body as SitePageUpdateInput));
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function POST() {
  try {
    const actor = await getAdminActor();
    return NextResponse.json(await siteBuilderService.publishHomepage(actor));
  } catch (error) {
    return adminJsonError(error);
  }
}
