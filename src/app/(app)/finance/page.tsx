import Link from "next/link";

import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { formatMinorMoney } from "@/features/finance/lib/formatters";
import { financialStatementService } from "@/features/finance/server/services/financial-statement.service";
import { payoutService } from "@/features/finance/server/services/payout.service";
import { royaltyEngineService } from "@/features/finance/server/services/royalty-engine.service";

export const metadata = {
  title: "Finans merkezi | Radarune",
  description:
    "Gelirlerini, royalty raporlarını, bakiyeni ve ödeme taleplerini Radarune finans merkezinden takip et.",
};

function dateLabel(value: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Bekliyor",
    APPROVED: "Onaylandı",
    PAID: "Ödendi",
    CANCELLED: "İptal edildi",
    FAILED: "Başarısız",
    OPEN: "Açık",
    CLOSED: "Kapandı",
  };

  return labels[status] ?? status;
}

export default async function FinancePage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = {
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  } as const;

  // Finans yetkisi olmayan üyelerde sayfa kırılmasın; merkezi yine açıklayıcı
  // bir başlangıç ekranı olarak göstermek daha iyi bir ürün deneyimi sağlar.
  const [statements, payouts, reports] = await Promise.all([
    financialStatementService.listStatements(actor).catch(() => []),
    payoutService.listPayouts(actor).catch(() => []),
    royaltyEngineService.listReports(actor).catch(() => []),
  ]);

  const balance = statements.reduce((sum, statement) => sum + statement.closingBalanceMinor, 0n);
  const currency = statements[0]?.currencyCode ?? reports[0]?.reportingCurrency ?? "USD";
  const totalRevenue = reports.reduce((sum, report) => sum + report.netRevenueMinor, 0n);
  const pendingPayouts = payouts.filter((payout) => ["PENDING", "APPROVED"].includes(payout.status));
  const paidOut = payouts
    .filter((payout) => payout.status === "PAID")
    .reduce((sum, payout) => sum + payout.amountMinor, 0n);
  const recentReports = reports.slice(0, 4);
  const recentPayouts = payouts.slice(0, 4);

  return (
    <main className="page-shell">
      <div className="flex w-full flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a1715] p-6 text-white shadow-[0_24px_90px_rgba(4,15,13,0.18)] md:p-10">
          <div className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 left-1/3 size-80 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Radarune finans merkezi
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
                Müziğinin değeri,<br className="hidden md:block" /> net bir görünümde.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/60 md:text-base">
                Gelirlerini, royalty raporlarını ve ödeme sürecini tek merkezden takip et.
                Yeni rapor geldiğinde bakiyen burada otomatik güncellenir.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-[#06201a] transition hover:bg-emerald-200" href="/payouts">
                Ödeme talebi oluştur →
              </Link>
              <Link className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10" href="/analytics">
                Analizleri gör
              </Link>
            </div>
          </div>
          <div className="relative mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5 text-xs text-white/45">
            <span>Hesap: {organization.organization.name}</span>
            <span>Para birimi: {currency}</span>
            <span>Son güncelleme: canlı veriler</span>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="panel group relative overflow-hidden p-6">
            <div className="absolute right-5 top-5 text-2xl text-emerald-500/70">↗</div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Kullanılabilir bakiye</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight">{formatMinorMoney(balance, currency)}</p>
            <p className="mt-2 text-sm text-muted">Ödeme talebi için hazır toplam</p>
          </article>
          <article className="panel group relative overflow-hidden p-6">
            <div className="absolute right-5 top-5 text-2xl text-emerald-500/70">◆</div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Net gelir</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight">{formatMinorMoney(totalRevenue, reports[0]?.reportingCurrency ?? currency)}</p>
            <p className="mt-2 text-sm text-muted">Oluşturulan royalty raporlarının toplamı</p>
          </article>
          <article className="panel group relative overflow-hidden p-6">
            <div className="absolute right-5 top-5 text-2xl text-amber-500/80">◷</div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Bekleyen ödemeler</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight">{pendingPayouts.length}</p>
            <p className="mt-2 text-sm text-muted">Onay veya işleme alınmayı bekliyor</p>
          </article>
          <article className="panel group relative overflow-hidden p-6">
            <div className="absolute right-5 top-5 text-2xl text-sky-500/80">✓</div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Bugüne kadar ödenen</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight">{formatMinorMoney(paidOut, currency)}</p>
            <p className="mt-2 text-sm text-muted">Tamamlanan payout toplamı</p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="panel overflow-hidden p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Gelir görünümü</p>
                <h2 className="mt-2 text-2xl font-semibold">Royalty raporların</h2>
              </div>
              <Link className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-surface-strong" href="/royalties">
                Tüm raporlar →
              </Link>
            </div>
            {recentReports.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-dashed border-line bg-surface/60 p-8">
                <p className="text-lg font-semibold">Henüz gelir raporu yok</p>
                <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
                  Dağıtım platformlarından gelir verisi geldiğinde raporların ve bakiyen burada görünecek.
                </p>
                <Link className="mt-5 inline-flex rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background" href="/releases">
                  Yayınlarını gör
                </Link>
              </div>
            ) : (
              <div className="mt-8 space-y-3">
                {recentReports.map((report) => (
                  <div className="rounded-2xl border border-line/70 bg-surface/60 p-4" key={report.id}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">{dateLabel(report.periodStart)} – {dateLabel(report.periodEnd)}</p>
                        <p className="mt-1 text-xs text-muted">Royalty raporu · {report.reportingCurrency}</p>
                      </div>
                      <p className="text-base font-semibold">{formatMinorMoney(report.netRevenueMinor, report.reportingCurrency)}</p>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-strong">
                      <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="panel p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Ödeme akışı</p>
                <h2 className="mt-2 text-2xl font-semibold">Son hareketler</h2>
              </div>
              <Link className="text-sm font-semibold text-accent hover:underline" href="/payouts">Yönet →</Link>
            </div>
            {recentPayouts.length === 0 ? (
              <div className="mt-8 rounded-3xl bg-surface/70 p-6">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-surface-strong text-xl">₺</div>
                <p className="mt-5 font-semibold">Henüz ödeme hareketi yok</p>
                <p className="mt-2 text-sm leading-6 text-muted">Bakiye oluştuğunda ödeme yöntemini ekleyip talep oluşturabilirsin.</p>
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                {recentPayouts.map((payout) => (
                  <div className="flex items-center justify-between gap-3 border-b border-line/70 pb-4" key={payout.id}>
                    <div>
                      <p className="text-sm font-semibold">{payout.artist?.name ?? payout.label?.name ?? "Radarune hesabı"}</p>
                      <p className="mt-1 text-xs text-muted">{statusLabel(payout.status)} · {dateLabel(payout.requestedAt)}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatMinorMoney(payout.amountMinor, payout.currencyCode)}</p>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link className="panel group p-6 transition hover:-translate-y-1 hover:border-accent/50" href="/royalties">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">01 · Raporlar</p>
            <h2 className="mt-3 text-xl font-semibold">Royalty detayları</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Platform, ülke, mağaza ve parça bazında gelir dağılımını incele.</p>
            <span className="mt-5 block text-sm font-semibold text-accent">Raporlara git →</span>
          </Link>
          <Link className="panel group p-6 transition hover:-translate-y-1 hover:border-accent/50" href="/payouts">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">02 · Ödemeler</p>
            <h2 className="mt-3 text-xl font-semibold">Payout yönetimi</h2>
            <p className="mt-2 text-sm leading-6 text-muted">IBAN, Wise, Payoneer veya Stripe yöntemlerini güvenle yönet.</p>
            <span className="mt-5 block text-sm font-semibold text-accent">Ödemeleri yönet →</span>
          </Link>
          <Link className="panel group p-6 transition hover:-translate-y-1 hover:border-accent/50" href="/analytics">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">03 · Performans</p>
            <h2 className="mt-3 text-xl font-semibold">Gelir ve dinlenme analizi</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Dinlenme, indirme ve gelir sinyallerini aynı zaman aralığında karşılaştır.</p>
            <span className="mt-5 block text-sm font-semibold text-accent">Analizi aç →</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
