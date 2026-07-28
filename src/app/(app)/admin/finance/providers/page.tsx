import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { paymentProviderConfigService } from "@/features/billing/server/services/payment-provider-config.service";
import { PaymentProviderSettingsForm } from "@/features/billing/components/payment-provider-settings-form";

export default async function AdminFinanceProvidersPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = { organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id } as const;
  const providers = await paymentProviderConfigService.listByOrganization(actor);
  return <AdminShell title="Payout ve ödeme sağlayıcıları" description="Credential değerleri maskelenir; provider yapılandırılmadan ödeme veya payout başarılı gösterilmez."><section className="panel p-6"><PaymentProviderSettingsForm initial={providers.map((provider) => ({ provider: provider.provider, active: provider.active, displayName: provider.displayName, hasCredentials: provider.hasCredentials, hasWebhookSecret: provider.hasWebhookSecret }))} /></section></AdminShell>;
}
