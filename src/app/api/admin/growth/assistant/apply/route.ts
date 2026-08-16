import { NextResponse } from "next/server";
import { getAdminIntelligenceActor } from "@/features/intelligence/server/admin-intelligence-context";
import { growthInsightService, type GrowthAction } from "@/features/growth-engine/server/growth-insight.service";

const actionKeys: GrowthAction["actionKey"][] = [
  "SMART_LINK_CRO",
  "WEEKLY_SHARE_CARD",
  "SOCIAL_AUTOMATION",
  "ARTIST_ONBOARDING",
  "REFERRAL_RULES",
];

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { actionKey?: unknown } | null;
    const actionKey = body?.actionKey;
    if (typeof actionKey !== "string" || !actionKeys.includes(actionKey as GrowthAction["actionKey"])) {
      return NextResponse.json({ error: "Geçersiz büyüme görevi." }, { status: 400 });
    }

    const actor = await getAdminIntelligenceActor();
    return NextResponse.json(await growthInsightService.applyAction(actor, actionKey as GrowthAction["actionKey"]));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Büyüme görevi uygulanamadı.";
    return NextResponse.json({ error: message }, { status: message.includes("yetki") ? 403 : 422 });
  }
}
