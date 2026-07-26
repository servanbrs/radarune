import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { discoverConfigService } from "@/features/platform/server/services/discover-config.service";
import type { DiscoverConfigUpdateInput } from "@/features/platform/schemas/platform.schema";

export async function GET() {
  try {
    const actor = await getAdminActor();
    return NextResponse.json(await discoverConfigService.get(actor.organizationId));
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await getAdminActor();
    const body: unknown = await request.json();
    return NextResponse.json(await discoverConfigService.update(actor, body as DiscoverConfigUpdateInput));
  } catch (error) {
    return adminJsonError(error);
  }
}
