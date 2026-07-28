import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { assertAdminPermission, toAdminActor } from "@/features/admin/server/admin-context";
import { spotifyProviderService } from "@/features/integrations/server/adapters/spotify-provider.service";
import { IntegrationStatusCard } from "@/features/integrations/components/integration-status-card";
import { env } from "@/lib/env";

export default async function SpotifyIntegrationPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  assertAdminPermission(actor, "integrations.spotify.view");
  const status = spotifyProviderService.validateConfiguration();
  return <AdminShell title="Spotify entegrasyonu" description="Client credential token cache yalnızca sunucu belleğinde tutulur ve istemciye aktarılmaz."><IntegrationStatusCard configured={status.success} missing={[!env.SPOTIFY_CLIENT_ID?"SPOTIFY_CLIENT_ID":"",!env.SPOTIFY_CLIENT_SECRET?"SPOTIFY_CLIENT_SECRET":""].filter(Boolean)} provider="Spotify" /></AdminShell>;
}
