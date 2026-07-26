import { NextResponse } from "next/server";
import { globalPlaylistService } from "@/features/growth/server/services/global-playlist.service";
import { getGlobalPlaylistAdminActor, globalPlaylistJsonError } from "@/features/growth/server/http/global-playlist-route";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getGlobalPlaylistAdminActor();
    const { id } = await context.params;
    return NextResponse.json(await globalPlaylistService.update(actor, id, await request.json()));
  } catch (error) {
    return globalPlaylistJsonError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getGlobalPlaylistAdminActor();
    const { id } = await context.params;
    return NextResponse.json(await globalPlaylistService.remove(actor, id));
  } catch (error) {
    return globalPlaylistJsonError(error);
  }
}
