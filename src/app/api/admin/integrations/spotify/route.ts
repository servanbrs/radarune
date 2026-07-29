import { NextResponse } from "next/server";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { adminJsonError, getAdminActor } from "@/features/admin/server/http/admin-route";
import { spotifyProviderService } from "@/features/integrations/server/adapters/spotify-provider.service";
import { integrationCredentialService } from "@/features/integrations/server/services/integration-credential.service";

export async function GET() {
  try {
    const actor = await getAdminActor();
    assertAdminPermission(actor, "integrations.spotify.view");
    const credentials = await integrationCredentialService.runtime(actor.organizationId, "SPOTIFY");
    return NextResponse.json(await spotifyProviderService.testConnection(credentials?.clientId && credentials.clientSecret ? credentials : undefined));
  } catch (error) {
    return adminJsonError(error);
  }
}
