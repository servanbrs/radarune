import { AdminShell } from "@/features/admin/components/admin-shell";
import { StatusBadge } from "@/features/admin/components/status-badges";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { distributionProviderConfigurationService } from "@/features/distribution-hub/server/services/provider-configuration.service";

export default async function AdminProvidersPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
  const providers = await distributionProviderConfigurationService.listByOrganization(actor);

  return (
    <AdminShell title="Provider yönetimi" description="Credential secret değerleri client tarafına gönderilmez; yalnızca maskeli durum ve health bilgisi gösterilir.">
      <section className="grid gap-4">
        {providers.map((provider) => (
          <article className="panel p-6" key={provider.id}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{provider.provider}</h2>
                <p className="mt-2 text-sm text-muted">
                  {provider.environment} · Öncelik {provider.priority} · Timeout {provider.timeoutSeconds}s
                </p>
              </div>
              <StatusBadge value={provider.isEnabled ? "Aktif" : "Pasif"} />
            </div>
            <p className="mt-4 text-sm text-muted">
              Credential: {provider.hasCredentials ? "Tanımlı" : "Tanımsız"} · Webhook secret:
              {provider.hasWebhookSecret ? " Tanımlı" : " Tanımsız"}
            </p>
            <p className="mt-2 text-sm text-muted">
              Capability: {provider.enabledCapabilities.join(", ") || "Etkin capability yok"}
            </p>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
