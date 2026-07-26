import Link from "next/link";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistService } from "@/features/artist/server/services/artist.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { formatMinorMoney } from "@/features/finance/lib/formatters";
import { PayoutMethodForm } from "@/features/finance/components/payout-method-form";
import { PayoutRequestForm } from "@/features/finance/components/payout-request-form";
import { payoutMethodService } from "@/features/finance/server/services/payout-method.service";
import { payoutService } from "@/features/finance/server/services/payout.service";
import { financialStatementService } from "@/features/finance/server/services/financial-statement.service";
import { labelService } from "@/features/label/server/services/label.service";

export default async function PayoutsPage() {
  const { organization, user } = await authSessionService.getDashboardContext();

  rbacService.redirectIfMissingEffectivePermission({
    membershipRole: organization.role,
    permission: "payouts:request:own",
    systemRole: user.systemRole,
  });

  const actor = {
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  } as const;

  const [methods, payouts, statements, artists, labels] = await Promise.all([
    payoutMethodService.listMethods(actor),
    payoutService.listPayouts(actor),
    financialStatementService.listStatements(actor),
    artistService.listByOrganizationId(organization.organization.id),
    labelService.listByOrganizationId(organization.organization.id),
  ]);

  return (
    <main className="page-shell">
      <div className="grid w-full gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col gap-6">
          <article className="panel p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Payout yönetimi</p>
            <h1 className="mt-3 text-3xl font-semibold">Yöntemler ve talepler</h1>
            <p className="mt-3 text-sm leading-7 text-muted">
              Payout API bağlantısı olmadan önce onay, iptal ve statement bazlı talep
              altyapısını burada yönetiyoruz.
            </p>
          </article>

          <article className="panel p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Payout talebi</p>
            <div className="mt-6">
              <PayoutRequestForm
                methods={methods.map((method) => ({
                  id: method.id,
                  accountHolderName: method.accountHolderName,
                  type: method.type,
                }))}
                statements={statements.map((statement) => ({
                  id: statement.id,
                  currencyCode: statement.currencyCode,
                  closingBalance: formatMinorMoney(
                    statement.closingBalanceMinor,
                    statement.currencyCode,
                  ),
                  subjectLabel:
                    statement.artist?.name ??
                    statement.label?.name ??
                    statement.beneficiaryUser?.name ??
                    "Bilinmiyor",
                }))}
              />
            </div>
          </article>

          <article className="panel p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Dışa aktarım</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-white"
                href="/api/finance/exports/statements?format=csv"
              >
                Statement CSV
              </Link>
              <Link
                className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-white"
                href="/api/finance/exports/statements?format=xlsx"
              >
                Statement Excel
              </Link>
              <Link
                className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-white"
                href="/api/finance/exports/statements?format=pdf"
              >
                Statement PDF
              </Link>
            </div>
          </article>
        </section>

        <section className="flex flex-col gap-6">
          <article className="panel p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Payout yöntemleri</p>
            <div className="mt-6">
              <PayoutMethodForm
                artists={artists.map((artist) => ({
                  id: artist.id,
                  name: artist.name,
                }))}
                labels={labels.map((label) => ({
                  id: label.id,
                  name: label.name,
                }))}
              />
            </div>
            <div className="mt-6 space-y-3">
              {methods.map((method) => (
                <div className="rounded-2xl border bg-white/70 px-4 py-3" key={method.id}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium">
                      {method.type} · {method.accountHolderName}
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted">
                      {method.isDefault ? "VARSAYILAN" : "AKTİF"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Payout geçmişi</p>
            <div className="mt-6 space-y-3">
              {payouts.length === 0 ? (
                <p className="rounded-2xl border bg-white/60 px-4 py-6 text-sm text-muted">
                  Henüz payout kaydı yok.
                </p>
              ) : (
                payouts.map((payout) => (
                  <div className="rounded-2xl border bg-white/70 px-4 py-4" key={payout.id}>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium">
                        {payout.artist?.name ??
                          payout.label?.name ??
                          payout.beneficiaryUser?.name ??
                          "Bilinmiyor"}
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-muted">
                        {payout.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {formatMinorMoney(payout.amountMinor, payout.currencyCode)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
