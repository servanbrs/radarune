import { NextResponse } from "next/server";
import { getGrowthActor, growthJsonError } from "@/features/growth/server/http/growth-route";
import { socialService } from "@/features/growth/server/services/social.service";

export async function POST(request: Request) {
  try {
    const actor = await getGrowthActor();
    const body = (await request.json()) as { artistId?: string };
    const result = await socialService.followArtist(actor, body.artistId ?? "");
    return NextResponse.json(result);
  } catch (error) {
    return growthJsonError(error);
  }
}
