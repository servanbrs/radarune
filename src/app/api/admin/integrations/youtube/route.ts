import { NextResponse } from "next/server";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { adminJsonError, getAdminActor } from "@/features/admin/server/http/admin-route";
import { youtubeProviderService } from "@/features/integrations/server/adapters/youtube-provider.service";
import { integrationCredentialService } from "@/features/integrations/server/services/integration-credential.service";
import { env } from "@/lib/env";

export async function GET() {
  try {
    const actor = await getAdminActor();
    assertAdminPermission(actor, "integrations.youtube.view");
    const credentials = await integrationCredentialService.runtime(actor.organizationId, "YOUTUBE");
    if (credentials?.apiKey) env.YOUTUBE_API_KEY = credentials.apiKey;
    return NextResponse.json(await youtubeProviderService.testConnection());
  } catch (error) {
    return adminJsonError(error);
  }
}
