import { NextResponse } from "next/server";
import { getGrowthActor, growthJsonError } from "@/features/growth/server/http/growth-route";
import { discoverService } from "@/features/growth/server/services/discover.service";

export async function POST(request: Request) {
  try {
    const actor = await getGrowthActor();
    const result = await discoverService.recordEvent(actor, await request.json());
    return NextResponse.json(result);
  } catch (error) {
    return growthJsonError(error);
  }
}
