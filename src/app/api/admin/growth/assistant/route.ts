import { NextResponse } from "next/server";
import { getAdminIntelligenceActor } from "@/features/intelligence/server/admin-intelligence-context";
import { growthInsightService } from "@/features/growth-engine/server/growth-insight.service";

export async function POST() {
  try {
    const actor = await getAdminIntelligenceActor();
    return NextResponse.json(await growthInsightService.createPlan(actor));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Büyüme planı oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: message.includes("yetki") ? 403 : 422 });
  }
}
