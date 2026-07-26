import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/features/authentication/server/auth";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";
import { votingService } from "@/features/platform/server/services/voting.service";
import type { CreateVoteInput } from "@/features/platform/schemas/platform.schema";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const tenant = await tenantContextService.resolveFromRequest();
  if (!tenant) return NextResponse.json({ error: "Tenant bulunamadı." }, { status: 404 });
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Oy vermek için giriş yapmalısınız." }, { status: 401 });
  const { slug } = await context.params;
  const campaign = await votingService.findPublicCampaign(tenant.id, slug);
  if (!campaign) return NextResponse.json({ error: "Kampanya bulunamadı." }, { status: 404 });
  const body: unknown = await request.json();
  const input = body as Omit<CreateVoteInput, "campaignId">;
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  try {
    const vote = await votingService.createVote({ organizationId: tenant.id, userId: session.user.id, ip }, { ...input, campaignId: campaign.id });
    return NextResponse.json({ data: { id: vote.id, status: vote.status } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Oy kaydedilemedi." }, { status: 422 });
  }
}
