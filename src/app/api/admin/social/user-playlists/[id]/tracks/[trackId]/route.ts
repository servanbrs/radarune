import { NextResponse } from "next/server";
import { globalPlaylistService } from "@/features/growth/server/services/global-playlist.service";
import { getGlobalPlaylistAdminActor, globalPlaylistJsonError } from "@/features/growth/server/http/global-playlist-route";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; trackId: string }> }) {
  try {
    const actor = await getGlobalPlaylistAdminActor();
    const { id, trackId } = await context.params;
    return NextResponse.json(await globalPlaylistService.removeTrackFromUserPlaylist(actor, id, trackId));
  } catch (error) {
    return globalPlaylistJsonError(error);
  }
}
