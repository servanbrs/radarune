import { NextResponse } from "next/server";
import { createPlaylistSchema } from "@/features/growth/schemas/growth.schema";
import { getGrowthActor, growthJsonError } from "@/features/growth/server/http/growth-route";
import { socialService } from "@/features/growth/server/services/social.service";

export async function POST(request: Request) {
  try {
    const actor = await getGrowthActor();
    const input = createPlaylistSchema.parse(await request.json());
    const result = await socialService.createPlaylist(actor, input);
    return NextResponse.json(result);
  } catch (error) {
    return growthJsonError(error);
  }
}
