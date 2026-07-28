import { AdminShell } from "@/features/admin/components/admin-shell";
import { StatusBadge } from "@/features/admin/components/status-badges";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { distributionProviderConfigurationService } from "@/features/distribution-hub/server/services/provider-configuration.service";
import { distributionProviderRegistry } from "@/features/distribution-hub/server/provider-registry";
import { ProviderConfigurationForm } from "@/features/distribution-hub/components/provider-configuration-form";

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
      <ProviderConfigurationForm initial={providers} />
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {providers.length === 0 ? distributionProviderRegistry.listAdapters().map((adapter) => <article className="panel border-line bg-surface p-6" key={adapter.key}><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{adapter.key}</h2><span className="rounded-full border border-line px-3 py-1 text-xs text-muted">Yapılandırılmadı</span></div><p className="mt-3 text-sm text-muted">Bu provider henüz kuruluş için eklenmedi. Credential ve webhook ayarlarını dağıtım provider ekranından oluşturun.</p><a className="mt-4 inline-block rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground" href="/admin/distribution/providers">Yapılandır</a></article>) : null}
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
