import { NextResponse } from "next/server";
import { getAdminActor, adminJsonError } from "@/features/admin/server/http/admin-route";
import { tenantDomainService } from "@/features/platform/server/services/tenant-domain.service";

export async function GET() {
  try {
    const actor = await getAdminActor();
    return NextResponse.json(await tenantDomainService.list(actor));
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getAdminActor();
    const body: unknown = await request.json();
    return NextResponse.json(await tenantDomainService.add(actor, body as { domain: string }), { status: 201 });
  } catch (error) {
    return adminJsonError(error);
  }
}
