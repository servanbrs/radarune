import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { tenantDomainService } from "@/features/platform/server/services/tenant-domain.service";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getAdminActor();
    const { id } = await context.params;
    return NextResponse.json(await tenantDomainService.verify(actor, id));
  } catch (error) {
    return adminJsonError(error);
  }
}
