import { NextResponse } from "next/server";
import { createPlaylistSchema } from "@/features/growth/schemas/growth.schema";
import { getGrowthActor, growthJsonError } from "@/features/growth/server/http/growth-route";
import { socialService } from "@/features/growth/server/services/social.service";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getGrowthActor();
    const input = createPlaylistSchema.parse(await request.json());
    return NextResponse.json(await socialService.updatePlaylist(actor, (await params).id, input));
  } catch (error) { return growthJsonError(error); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getGrowthActor();
    return NextResponse.json(await socialService.deletePlaylist(actor, (await params).id));
  } catch (error) { return growthJsonError(error); }
}
