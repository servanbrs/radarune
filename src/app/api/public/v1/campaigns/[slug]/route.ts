import { NextResponse } from "next/server";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";
import { votingService } from "@/features/platform/server/services/voting.service";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const tenant = await tenantContextService.resolveFromRequest();
  if (!tenant) return NextResponse.json({ error: "Tenant bulunamadı." }, { status: 404 });
  const { slug } = await context.params;
  const campaign = await votingService.findPublicCampaign(tenant.id, slug);
  if (!campaign) return NextResponse.json({ error: "Kampanya bulunamadı." }, { status: 404 });
  return NextResponse.json({ data: campaign });
}
