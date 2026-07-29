import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { adminDistributionService } from "@/features/distribution-hub/server/services/admin-distribution.service";
import { AdminShell } from "@/features/admin/components/admin-shell";

export default async function AdminDistributionHealthPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  rbacService.redirectIfMissingEffectivePermission({
    membershipRole: organization.role,
    permission: "distribution:view",
    systemRole: user.systemRole,
  });

  const checks = await adminDistributionService.listHealthChecks({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  const healthy = checks.filter((check) => check.success).length;
  return <AdminShell title="Sistem sağlığı" description="Provider bağlantılarını ve dağıtım altyapısının son sağlık kontrollerini izleyin.">
      <div className="grid gap-3 sm:grid-cols-3"><div className="panel bg-surface p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Kontrol</p><p className="mt-2 text-2xl font-semibold">{checks.length}</p></div><div className="panel bg-surface p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Sağlıklı</p><p className="mt-2 text-2xl font-semibold text-accent">{healthy}</p></div><div className="panel bg-surface p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Sorunlu</p><p className="mt-2 text-2xl font-semibold text-danger">{checks.length - healthy}</p></div></div>
      <section className="mt-5 grid gap-4">
        {checks.length === 0 ? <div className="panel p-10 text-center"><p className="font-semibold">Henüz sağlık kontrolü yok</p><p className="mt-2 text-sm text-muted">Provider sayfasından bağlantı testi çalıştırdığınızda sonuçlar burada kaydedilir.</p></div> : checks.map((check) => (
          <article className="panel p-5" key={check.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{check.provider}</h2>
              <span className="rounded-full border border-line bg-surface-strong px-3 py-1 text-xs font-semibold">
                {check.success ? "Başarılı" : "Hatalı"}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted">
              {check.environment} · {check.responseTimeMs ?? 0}ms · {check.checkedAt.toLocaleString("tr-TR")}
            </p>
            {check.errorMessage ? <p className="mt-2 text-sm text-danger">{check.errorMessage}</p> : null}
          </article>
        ))}
      </section>
    </AdminShell>;
}
