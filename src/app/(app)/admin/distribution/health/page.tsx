import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { adminDistributionService } from "@/features/distribution-hub/server/services/admin-distribution.service";

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

  return (
    <main className="page-shell">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Health</p>
        <h1 className="mt-3 text-3xl font-semibold">Provider sağlık kontrolleri</h1>
      </section>
      <section className="grid gap-4">
        {checks.map((check) => (
          <article className="panel p-5" key={check.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{check.provider}</h2>
              <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold">
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
    </main>
  );
}
