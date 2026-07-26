import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { tenantBrandingService } from "@/features/platform/server/services/tenant-branding.service";
import { tenantRepository } from "@/features/platform/server/repositories/tenant.repository";
import type { BrandingUpdateInput } from "@/features/platform/schemas/platform.schema";

export async function GET() {
  try {
    const actor = await getAdminActor();
    const tenant = await tenantRepository.findById(actor.organizationId);
    return NextResponse.json(tenant?.tenantBranding ?? null);
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await getAdminActor();
    const body: unknown = await request.json();
    return NextResponse.json(await tenantBrandingService.update(actor, body as BrandingUpdateInput));
  } catch (error) {
    return adminJsonError(error);
  }
}
