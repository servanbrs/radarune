import { NextResponse } from "next/server";
import { globalPlaylistService } from "@/features/growth/server/services/global-playlist.service";
import { getGlobalPlaylistAdminActor, globalPlaylistJsonError } from "@/features/growth/server/http/global-playlist-route";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getGlobalPlaylistAdminActor();
    const { id } = await context.params;
    return NextResponse.json(await globalPlaylistService.addTrackToUserPlaylist(actor, id, await request.json()), { status: 201 });
  } catch (error) {
    return globalPlaylistJsonError(error);
  }
}
