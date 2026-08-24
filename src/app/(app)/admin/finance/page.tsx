import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistService } from "@/features/artist/server/services/artist.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { FinancialAdjustmentForm } from "@/features/finance/components/financial-adjustment-form";
import { RevenueImportForm } from "@/features/finance/components/revenue-import-form";
import { RoyaltyGenerateForm } from "@/features/finance/components/royalty-generate-form";
import { RoyaltySplitForm } from "@/features/finance/components/royalty-split-form";
import { formatMinorMoney } from "@/features/finance/lib/formatters";
import { revenueImportService } from "@/features/finance/server/services/revenue-import.service";
import { financialStatementService } from "@/features/finance/server/services/financial-statement.service";
import { payoutService } from "@/features/finance/server/services/payout.service";
import { royaltyEngineService } from "@/features/finance/server/services/royalty-engine.service";
import { labelService } from "@/features/label/server/services/label.service";
import Link from "next/link";
import { AdminShell } from "@/features/admin/components/admin-shell";

export default async function AdminFinancePage() {
  const { organization, user } = await authSessionService.getDashboardContext();

  rbacService.redirectIfMissingEffectivePermission({
    membershipRole: organization.role,
    permission: "revenue-import:view",
    systemRole: user.systemRole,
  });

  const actor = {
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  } as const;

  const [imports, reports, statements, payouts, artists, labels] = await Promise.all([
    revenueImportService.listImportsByOrganization(actor),
    royaltyEngineService.listReports(actor),
    financialStatementService.listStatements(actor),
    payoutService.listPayouts(actor),
    artistService.listByOrganizationId(organization.organization.id),
    labelService.listByOrganizationId(organization.organization.id),
  ]);

  return (
    <AdminShell title="Finans yönetimi" description="Revenue import, royalty, payout ve finansal düzeltmeleri aynı operasyon görünümünden yönetin.">
      <div className="flex w-full flex-col gap-6">
        <Link className="w-fit rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold" href="/admin/finance/providers">Payout / ödeme sağlayıcı ayarları</Link>
        <section className="grid gap-6 lg:grid-cols-4">
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Platform geliri</p>
            <p className="mt-3 text-2xl font-semibold">
              {formatMinorMoney(
                reports.reduce((sum, report) => sum + report.grossRevenueMinor, 0n),
                "USD",
              )}
            </p>
          </article>
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Radarune komisyonu
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {formatMinorMoney(
                reports.reduce((sum, report) => sum + report.commissionMinor, 0n),
                "USD",
              )}
            </p>
          </article>
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Bekleyen payout</p>
            <p className="mt-3 text-2xl font-semibold">
              {payouts.filter((payout) => payout.status === "PENDING").length}
            </p>
          </article>
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Toplam payout</p>
            <p className="mt-3 text-2xl font-semibold">
              {formatMinorMoney(
                payouts.reduce((sum, payout) => sum + payout.amountMinor, 0n),
                "USD",
              )}
            </p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="panel p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Revenue import</p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              OneRPM gelir dışa aktarım CSV&apos;sini yükleyin. Artist slug bulunmasa bile ISRC veya UPC,
              Radarune&apos;daki yayınla eşleşiyorsa sanatçı ve label otomatik bağlanır. Eşleşmeyen satırlar
              güvenlik için içeri alınmaz; OneRPM hesabı ve 2FA bilgileri sunucuda saklanmaz.
            </p>
            <div className="mt-6">
              <RevenueImportForm />
            </div>
          </article>
          <article className="panel p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Royalty üretimi</p>
            <div className="mt-6">
              <RoyaltyGenerateForm />
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="panel p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Royalty splitleri</p>
            <div className="mt-6">
              <RoyaltySplitForm
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
          </article>
          <article className="panel p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Düzeltmeler</p>
            <div className="mt-6">
              <FinancialAdjustmentForm
                statements={statements.map((statement) => ({
                  id: statement.id,
                  currencyCode: statement.currencyCode,
                  subjectLabel:
                    statement.artist?.name ??
                    statement.label?.name ??
                    statement.beneficiaryUser?.name ??
                    "Bilinmiyor",
                }))}
              />
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="panel p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Import geçmişi</p>
            <div className="mt-6 space-y-3">
              {imports.map((item) => (
                <div className="rounded-2xl border bg-white/70 px-4 py-4" key={item.id}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium">{item.fileName}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {item.importedRowCount}/{item.rowCount} içe aktarıldı · {item.reportingCurrency}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Statements</p>
            <div className="mt-6 space-y-3">
              {statements.map((statement) => (
                <div className="rounded-2xl border bg-white/70 px-4 py-4" key={statement.id}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium">
                      {statement.artist?.name ??
                        statement.label?.name ??
                        statement.beneficiaryUser?.name ??
                        "Bilinmiyor"}
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted">
                      {statement.currencyCode}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    Kapanış bakiyesi:{" "}
                    {formatMinorMoney(
                      statement.closingBalanceMinor,
                      statement.currencyCode,
                    )}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </AdminShell>
  );
}
