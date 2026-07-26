import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { assertAdminPermission, toAdminActor } from "@/features/admin/server/admin-context";
import { spotifyProviderService } from "@/features/integrations/server/adapters/spotify-provider.service";

export default async function SpotifyIntegrationPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  assertAdminPermission(actor, "integrations.spotify.view");
  const status = spotifyProviderService.validateConfiguration();
  return <AdminShell title="Spotify entegrasyonu" description="Client credential token cache yalnızca sunucu belleğinde tutulur ve istemciye aktarılmaz."><section className="panel p-6"><p className="text-sm font-semibold">Yapılandırma durumu</p><p className="mt-2 text-sm text-muted">{status.success ? "Yapılandırıldı. Bağlantı testi API üzerinden yapılabilir." : status.message}</p></section></AdminShell>;
}
