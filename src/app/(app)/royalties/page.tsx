import Link from "next/link";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { formatMinorMoney } from "@/features/finance/lib/formatters";
import { royaltyEngineService } from "@/features/finance/server/services/royalty-engine.service";

export default async function RoyaltiesPage() {
  const { organization, user } = await authSessionService.getDashboardContext();

  rbacService.redirectIfMissingEffectivePermission({
    membershipRole: organization.role,
    permission: "royalties:view:own",
    systemRole: user.systemRole,
  });

  const reports = await royaltyEngineService.listReports({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  return (
    <main className="page-shell">
      <div className="flex w-full flex-col gap-6">
        <section className="panel p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Royalty raporları</p>
          <h1 className="mt-3 text-3xl font-semibold">Değiştirilemez royalty dönemleri</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            Revenue import sonrası üretilen royalty raporları immutable tutulur ve
            export uçlarıyla CSV, Excel ve PDF olarak indirilebilir.
          </p>
        </section>

        <section className="panel p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted">Rapor listesi</p>
              <h2 className="mt-2 text-2xl font-semibold">{reports.length} rapor</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {reports.length === 0 ? (
              <p className="rounded-2xl border bg-white/60 px-4 py-6 text-sm text-muted">
                Henüz royalty raporu üretilmedi.
              </p>
            ) : (
              reports.map((report) => (
                <article className="rounded-[1.5rem] border bg-white/70 p-5" key={report.id}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {report.periodStart.toISOString().slice(0, 10)} -{" "}
                        {report.periodEnd.toISOString().slice(0, 10)}
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        Para birimi: {report.reportingCurrency}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-white"
                        href={`/api/finance/exports/royalty-reports/${report.id}?format=csv`}
                      >
                        CSV
                      </Link>
                      <Link
                        className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-white"
                        href={`/api/finance/exports/royalty-reports/${report.id}?format=xlsx`}
                      >
                        Excel
                      </Link>
                      <Link
                        className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-white"
                        href={`/api/finance/exports/royalty-reports/${report.id}?format=pdf`}
                      >
                        PDF
                      </Link>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Brüt</p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatMinorMoney(report.grossRevenueMinor, report.reportingCurrency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">
                        Platform ücreti
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatMinorMoney(report.platformFeeMinor, report.reportingCurrency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">
                        Komisyon
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatMinorMoney(report.commissionMinor, report.reportingCurrency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Net</p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatMinorMoney(report.netRevenueMinor, report.reportingCurrency)}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
