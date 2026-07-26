import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { entitlementService } from "@/features/billing/server/services/entitlement.service";
import { paymentProviderConfigService } from "@/features/billing/server/services/payment-provider-config.service";
import { planCatalogService } from "@/features/billing/server/services/plan-catalog.service";
import { subscriptionService } from "@/features/billing/server/services/subscription.service";
import { formatMinorMoney } from "@/features/finance/lib/formatters";
import { rbacService } from "@/features/authorization/server/rbac";

export default async function BillingPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = {
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
    email: user.email,
    name: user.name,
  } as const;

  const [plans, organizationSubscriptions, featureMap] = await Promise.all([
    planCatalogService.listPublicPlans(),
    subscriptionService.listSubscriptions(actor, { organizationId: actor.organizationId }, {}),
    entitlementService.getFeatureMap({ organizationId: actor.organizationId }),
  ]);

  const canManageProviders =
    actor.membershipRole === "OWNER" ||
    rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "financial-settings:update",
      systemRole: actor.systemRole,
    });

  const providerConfigs = canManageProviders
    ? await paymentProviderConfigService.listByOrganization(actor)
    : [];

  return (
    <main className="page-shell">
      <div className="flex w-full flex-col gap-6">
        <section className="panel p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">
            Sprint 6
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Abonelik ve Faturalandırma</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            Organizasyon aboneliklerinizi, plan haklarınızı ve ödeme sağlayıcı
            yapılandırmalarınızı bu merkezden takip edebilirsiniz.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Aktif abonelik
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {organizationSubscriptions.success && organizationSubscriptions.data[0]
                ? organizationSubscriptions.data[0].plan.name
                : "FREE"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {organizationSubscriptions.success && organizationSubscriptions.data[0]
                ? organizationSubscriptions.data[0].status
                : "Ücretsiz plan varsayılıyor"}
            </p>
          </article>
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Feature sayısı
            </p>
            <p className="mt-3 text-2xl font-semibold">{featureMap.size}</p>
            <p className="mt-2 text-sm text-muted">
              Mevcut plan için çözümlenen entitlement anahtarları
            </p>
          </article>
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Provider yapılandırması
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {providerConfigs.filter((config) => config.active).length}
            </p>
            <p className="mt-2 text-sm text-muted">
              Aktif ödeme sağlayıcısı
            </p>
          </article>
        </section>

        <section className="panel p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">
            Plan kataloğu
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {plans.map((plan) => (
              <article className="rounded-3xl border border-line/70 bg-white/70 p-5" key={plan.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{plan.name}</h2>
                    <p className="mt-2 text-sm text-muted">
                      {plan.description ?? "Açıklama tanımlanmadı."}
                    </p>
                  </div>
                  <span className="rounded-full border border-accent/20 bg-accent/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    {plan.code}
                  </span>
                </div>
                <div className="mt-4 flex flex-col gap-2 text-sm text-muted">
                  <p>Deneme süresi: {plan.trialDays} gün</p>
                  <p>Özellik adedi: {plan.features.length}</p>
                  <p>
                    Fiyatlar:{" "}
                    {plan.prices.length > 0
                      ? plan.prices
                          .map((price) =>
                            `${formatMinorMoney(price.amountMinor, price.currencyCode)} / ${price.interval}`,
                          )
                          .join(", ")
                      : "Henüz tanımlanmadı"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {canManageProviders ? (
          <section className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Provider ayarları
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {providerConfigs.map((config) => (
                <article className="rounded-3xl border border-line/70 bg-white/70 p-5" key={config.id}>
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold">{config.displayName ?? config.provider}</h2>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {config.active ? "AKTIF" : "PASIF"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 text-sm text-muted">
                    <p>Credential tanımlı: {config.hasCredentials ? "Evet" : "Hayır"}</p>
                    <p>Webhook secret: {config.hasWebhookSecret ? "Tanımlı" : "Tanımsız"}</p>
                    <p>Maskeli alan sayısı: {Object.keys(config.credentials).length}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
