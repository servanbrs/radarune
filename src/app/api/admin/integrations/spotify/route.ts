import { NextResponse } from "next/server";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { adminJsonError, getAdminActor } from "@/features/admin/server/http/admin-route";
import { spotifyProviderService } from "@/features/integrations/server/adapters/spotify-provider.service";

export async function GET() {
  try {
    const actor = await getAdminActor();
    assertAdminPermission(actor, "integrations.spotify.view");
    return NextResponse.json(await spotifyProviderService.testConnection());
  } catch (error) {
    return adminJsonError(error);
  }
}
