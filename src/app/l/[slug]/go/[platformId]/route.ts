import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { growthRepository } from "@/features/growth/server/repositories/growth.repository";
import { smartLinkAnalyticsService } from "@/features/growth/server/services/smart-link-analytics.service";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string; platformId: string }> }) {
  const { slug, platformId } = await params;
  const platform = await growthRepository.findPublicSmartLinkPlatform(slug, platformId);
  if (!platform) return NextResponse.json({ error: "Bağlantı bulunamadı." }, { status: 404 });
  const headerList = await headers();
  const query = new URL(request.url).searchParams;
  await smartLinkAnalyticsService.recordClick({
    organizationId: platform.organizationId,
    smartLinkId: platform.smartLinkId,
    platformId: platform.id,
    ip: headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0",
    ...(headerList.get("user-agent") ? { userAgent: headerList.get("user-agent")! } : {}),
    ...(headerList.get("referer") ? { referrer: headerList.get("referer")! } : {}),
    ...(query.get("utm_source") ? { utmSource: query.get("utm_source")! } : {}),
    ...(query.get("utm_medium") ? { utmMedium: query.get("utm_medium")! } : {}),
    ...(query.get("utm_campaign") ? { utmCampaign: query.get("utm_campaign")! } : {}),
  });
  return NextResponse.redirect(platform.url);
}
