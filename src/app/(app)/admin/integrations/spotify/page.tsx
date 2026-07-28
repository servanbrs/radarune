import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { assertAdminPermission, toAdminActor } from "@/features/admin/server/admin-context";
import { spotifyProviderService } from "@/features/integrations/server/adapters/spotify-provider.service";
import { IntegrationStatusCard } from "@/features/integrations/components/integration-status-card";
import { integrationCredentialService } from "@/features/integrations/server/services/integration-credential.service";

export default async function SpotifyIntegrationPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  assertAdminPermission(actor, "integrations.spotify.view");
  const status = spotifyProviderService.validateConfiguration();
  const saved = await integrationCredentialService.runtime(actor.organizationId, "SPOTIFY");
  const configured = status.success || Boolean(saved?.clientId && saved.clientSecret);
  return <AdminShell title="Spotify entegrasyonu" description="Client credential token cache yalnızca sunucu belleğinde tutulur ve istemciye aktarılmaz."><IntegrationStatusCard configured={configured} missing={configured ? [] : ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET"]} provider="Spotify" /></AdminShell>;
}
