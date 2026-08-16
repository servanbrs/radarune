import { NextResponse } from "next/server";
import { getAdminIntelligenceActor } from "@/features/intelligence/server/admin-intelligence-context";
import { growthRepository } from "@/features/growth/server/repositories/growth.repository";

export async function GET() {
  try {
    const actor = await getAdminIntelligenceActor();
    return NextResponse.json(await growthRepository.compareSmartLinkClicksByUtm(actor.organizationId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "UTM verisi alınamadı.";
    return NextResponse.json({ error: message }, { status: message.includes("yetki") ? 403 : 422 });
  }
}
