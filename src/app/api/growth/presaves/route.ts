import { NextResponse } from "next/server";
import { createPreSaveCampaignSchema } from "@/features/growth/schemas/growth.schema";
import { getGrowthActor, growthJsonError } from "@/features/growth/server/http/growth-route";
import { preSaveService } from "@/features/growth/server/services/presave.service";

export async function POST(request: Request) {
  try {
    const actor = await getGrowthActor();
    const input = createPreSaveCampaignSchema.parse(await request.json());
    const result = await preSaveService.create(actor, input);
    return NextResponse.json(result);
  } catch (error) {
    return growthJsonError(error);
  }
}
