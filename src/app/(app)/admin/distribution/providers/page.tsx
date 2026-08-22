import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { distributionProviderConfigurationService } from "@/features/distribution-hub/server/services/provider-configuration.service";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { ProviderConfigurationForm } from "@/features/distribution-hub/components/provider-configuration-form";

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

  const oneRpm = providers.find((provider) => provider.provider === "ONE_RPM");
  const oneRpmMode = oneRpm?.publicMetadata?.mode ?? "MANUAL";
  const oneRpmModeLabel = oneRpmMode === "AUTOMATION" ? "Onay sonrası otomatik hazırlama" : "Panelden manuel hazırlama";

  return (
    <AdminShell title="Dağıtım bağlantıları" description="Yayınların ONErpm ve diğer dağıtım servislerine nasıl gönderileceğini Türkçe ve anlaşılır biçimde yönetin.">
      <section className="mb-5 overflow-hidden rounded-3xl border border-emerald-900/10 bg-[#101817] p-6 text-white shadow-[0_18px_55px_rgba(15,23,42,0.12)] sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
              ONErpm yayın hazırlama
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {oneRpmMode === "AUTOMATION" ? "Oturum sonrası otomatik hazırlama aktif" : "Manuel kontrol akışı hazır"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
              Yayın kontrolünden sonra sistem ONErpm formunu ve dosya alanlarını
              hazırlamaya çalışır. 2FA, CAPTCHA ve son gönderme işlemi güvenlik
              nedeniyle her zaman senin kontrolünde kalır.
            </p>
          </div>
          <div className="grid min-w-[210px] gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm">
            <div className="flex items-center justify-between gap-4"><span className="text-white/50">Çalışma şekli</span><strong className="text-emerald-300">{oneRpmModeLabel}</strong></div>
            <div className="flex items-center justify-between gap-4"><span className="text-white/50">Bağlantı</span><strong>{oneRpm?.isEnabled ? "Aktif" : "Kapalı"}</strong></div>
            <div className="flex items-center justify-between gap-4"><span className="text-white/50">Giriş yöntemi</span><strong>Manuel + 2FA</strong></div>
          </div>
        </div>
      </section>
      <ProviderConfigurationForm initial={providers} />
    </AdminShell>
  );
}
