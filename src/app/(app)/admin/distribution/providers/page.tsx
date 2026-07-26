import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { distributionProviderConfigurationService } from "@/features/distribution-hub/server/services/provider-configuration.service";

export default async function AdminDistributionProvidersPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  rbacService.redirectIfMissingEffectivePermission({
    membershipRole: organization.role,
    permission: "distribution:view",
    systemRole: user.systemRole,
  });

  const providers = await distributionProviderConfigurationService.listByOrganization({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  return (
    <main className="page-shell">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Providerlar</p>
        <h1 className="mt-3 text-3xl font-semibold">Dağıtım provider yönetimi</h1>
      </section>
      <section className="grid gap-4">
        {providers.map((provider) => (
          <article className="panel p-5" key={provider.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{provider.provider}</h2>
                <p className="mt-1 text-sm text-muted">
                  {provider.environment} · Öncelik {provider.priority} · Timeout {provider.timeoutSeconds}s
                </p>
              </div>
              <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold">
                {provider.isEnabled ? "Aktif" : "Pasif"}
              </span>
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
    </main>
  );
}
