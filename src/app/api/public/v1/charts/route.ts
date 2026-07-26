import { NextResponse } from "next/server";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";
import { chartService } from "@/features/platform/server/services/chart.service";

export async function GET(request: Request) {
  const tenant = await tenantContextService.resolveFromRequest();
  if (!tenant) return NextResponse.json({ error: "Tenant bulunamadı." }, { status: 404 });
  const url = new URL(request.url);
  const query = {
    ...(url.searchParams.get("type") ? { type: url.searchParams.get("type") as string } : {}),
    ...(url.searchParams.get("countryCode") ? { countryCode: url.searchParams.get("countryCode") as string } : {}),
  };
  return NextResponse.json({ data: await chartService.listPublic(tenant.id, query) });
}
