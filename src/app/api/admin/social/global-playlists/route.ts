import { NextResponse } from "next/server";
import { globalPlaylistService } from "@/features/growth/server/services/global-playlist.service";
import { getGlobalPlaylistAdminActor, globalPlaylistJsonError } from "@/features/growth/server/http/global-playlist-route";

export async function GET() {
  try {
    return NextResponse.json(await globalPlaylistService.listForAdmin(await getGlobalPlaylistAdminActor()));
  } catch (error) {
    return globalPlaylistJsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getGlobalPlaylistAdminActor();
    return NextResponse.json(await globalPlaylistService.create(actor, await request.json()), { status: 201 });
  } catch (error) {
    return globalPlaylistJsonError(error);
  }
}
