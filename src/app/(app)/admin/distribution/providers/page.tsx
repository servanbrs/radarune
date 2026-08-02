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

  return (
    <AdminShell title="Dağıtım provider yönetimi" description="Provider credential, yetenek, webhook ve bağlantı testlerini tek merkezden yönetin.">
      <section className="mb-5 overflow-hidden rounded-3xl border border-emerald-900/10 bg-[#101817] p-6 text-white shadow-[0_18px_55px_rgba(15,23,42,0.12)] sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
              ONErpm otomatik dağıtım
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {oneRpmMode === "AUTOMATION" ? "Oturum sonrası otomatik hazırlama aktif" : "Manuel onay akışı hazır"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
              Sistem giriş yaptıktan sonra ONErpm formunu doldurur ve ekranı
              onaya hazır bırakır. CAPTCHA, OTP ve geri döndürülemez Submit
              işlemleri her zaman kullanıcıya aittir.
            </p>
          </div>
          <div className="grid min-w-[210px] gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm">
            <div className="flex items-center justify-between gap-4"><span className="text-white/50">Mod</span><strong className="text-emerald-300">{oneRpmMode}</strong></div>
            <div className="flex items-center justify-between gap-4"><span className="text-white/50">Provider</span><strong>{oneRpm?.isEnabled ? "Aktif" : "Kapalı"}</strong></div>
            <div className="flex items-center justify-between gap-4"><span className="text-white/50">Credential</span><strong>{oneRpm?.hasCredentials ? "Kayıtlı" : "Eksik"}</strong></div>
          </div>
        </div>
      </section>
      <ProviderConfigurationForm initial={providers} />
    </AdminShell>
  );
}
