import { NextResponse } from "next/server";
import { getGrowthActor, growthJsonError } from "@/features/growth/server/http/growth-route";
import { socialService } from "@/features/growth/server/services/social.service";

export async function POST(request: Request) {
  try {
    const actor = await getGrowthActor();
    const result = await socialService.like(actor, await request.json());
    return NextResponse.json(result);
  } catch (error) {
    return growthJsonError(error);
  }
}
