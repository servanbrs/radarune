import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { formatMinorMoney } from "@/features/finance/lib/formatters";
import { analyticsService } from "@/features/finance/server/services/analytics.service";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { financeAccessService } from "@/features/finance/server/services/finance-access.service";
import { creatorAccessService } from "@/features/authorization/server/creator-access.service";
import { redirect } from "next/navigation";

type AnalyticsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return typeof value === "string" ? value : undefined;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const { organization, user } = await authSessionService.getDashboardContext();

  if (!creatorAccessService.getAccess({ systemRole: user.systemRole }).canViewAnalytics) {
    redirect("/dashboard");
  }

  const analyticsPermission = user.systemRole === "MODERATOR"
    ? "analytics:view:all"
    : ["ORGANIZER", "LABEL", "LABEL_MANAGER"].includes(String(user.systemRole))
      ? "analytics:view:label"
      : "analytics:view:own";
  rbacService.redirectIfMissingEffectivePermission({
    membershipRole: organization.role,
    permission: analyticsPermission,
    systemRole: user.systemRole,
  });

  const actor = {
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  } as const;
  const accessibleArtistIds = await financeAccessService.listAccessibleArtistIds(actor);
  if (accessibleArtistIds !== null && accessibleArtistIds.length === 0) {
    redirect("/become?reason=finance-artist-required");
  }

  const dashboard = await analyticsService.getDashboard(
    actor,
    {
      periodStart: readSearchParam(params, "periodStart")
        ? new Date(readSearchParam(params, "periodStart")!)
        : undefined,
      periodEnd: readSearchParam(params, "periodEnd")
        ? new Date(readSearchParam(params, "periodEnd")!)
        : undefined,
      artistId: readSearchParam(params, "artistId"),
      labelId: readSearchParam(params, "labelId"),
      releaseTitle: readSearchParam(params, "releaseTitle"),
      trackKey: readSearchParam(params, "trackKey"),
      storeName: readSearchParam(params, "storeName"),
      countryCode: readSearchParam(params, "countryCode"),
    },
  );

  return (
    <main className="page-shell">
      <div className="flex w-full flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a1715] p-6 text-white shadow-[0_24px_90px_rgba(4,15,13,0.18)] md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="relative text-xs uppercase tracking-[0.24em] text-emerald-300">
                Analytics paneli
              </p>
              <h1 className="relative text-3xl font-semibold">Dinlenme, gelir ve erişim</h1>
              <p className="relative max-w-3xl text-sm leading-7 text-white/55">
                Artist, label and admin görünümünü aynı finans omurgası üzerinden
                çalıştıran performans ekranı.
              </p>
            </div>
            <Link className="inline-flex rounded-full border border-line px-4 py-2 text-sm font-semibold" href="/analytics/detail">Detaylı analiz sayfası →</Link>
            <form className="grid gap-3 md:grid-cols-4" method="GET">
              <Input defaultValue={readSearchParam(params, "periodStart")} name="periodStart" type="date" />
              <Input defaultValue={readSearchParam(params, "periodEnd")} name="periodEnd" type="date" />
              <Input defaultValue={readSearchParam(params, "storeName")} name="storeName" type="text" />
              <Input defaultValue={readSearchParam(params, "countryCode")} name="countryCode" type="text" />
              <Input defaultValue={readSearchParam(params, "artistId")} name="artistId" type="text" />
              <Input defaultValue={readSearchParam(params, "labelId")} name="labelId" type="text" />
              <Input defaultValue={readSearchParam(params, "releaseTitle")} name="releaseTitle" type="text" />
              <Select defaultValue="" name="scope">
                <option value="">Filtreler hazır</option>
                <option value="custom">Özel filtre</option>
              </Select>
              <button className="rounded-full border bg-accent px-5 py-3 text-sm font-medium text-accent-foreground md:col-span-4" type="submit">
                Filtreleri uygula
              </button>
            </form>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Dinlenme</p>
            <p className="mt-3 text-3xl font-semibold">
              {dashboard.summary.streams.toLocaleString("tr-TR")}
            </p>
          </article>
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">İndirme</p>
            <p className="mt-3 text-3xl font-semibold">
              {dashboard.summary.downloads.toLocaleString("tr-TR")}
            </p>
          </article>
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Net gelir</p>
            <p className="mt-3 text-3xl font-semibold">
              {formatMinorMoney(dashboard.summary.netRevenueMinor, "USD")}
            </p>
          </article>
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Brüt gelir</p>
            <p className="mt-3 text-3xl font-semibold">
              {formatMinorMoney(dashboard.summary.grossRevenueMinor, "USD")}
            </p>
          </article>
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Playlist görünümü
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {dashboard.summary.playlistAppearances.toLocaleString("tr-TR")}
            </p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Günlük trend</p>
            <div className="mt-5 space-y-3">
              {dashboard.charts.dailyTrend.length === 0 ? (
                <p className="rounded-2xl border bg-white/60 px-4 py-4 text-sm text-muted">
                  Seçilen aralıkta trend verisi bulunamadı.
                </p>
              ) : (
                dashboard.charts.dailyTrend.map((row) => (
                  <div className="flex items-center justify-between rounded-2xl border bg-white/70 px-4 py-3" key={row.reportDate.toISOString()}>
                    <span className="text-sm font-medium">
                      {row.reportDate.toISOString().slice(0, 10)}
                    </span>
                    <span className="text-sm text-muted">
                      {row._sum?.streamCount ?? 0} dinlenme ·{" "}
                      {formatMinorMoney(row._sum?.netRevenueMinor ?? BigInt(0), "USD")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Ülke dağılımı</p>
            <div className="mt-5 space-y-3">
              {dashboard.charts.countryDistribution.map((row) => (
                <div className="flex items-center justify-between rounded-2xl border bg-white/70 px-4 py-3" key={row.countryCode}>
                  <span className="text-sm font-medium">{row.countryCode}</span>
                  <span className="text-sm text-muted">
                    {row._sum?.streamCount ?? 0} dinlenme ·{" "}
                    {formatMinorMoney(row._sum?.netRevenueMinor ?? BigInt(0), "USD")}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Platformlar</p>
            <div className="mt-5 space-y-3">
              {dashboard.charts.platformDistribution.map((row) => (
                <div className="flex items-center justify-between rounded-2xl border bg-white/70 px-4 py-3" key={row.platformName}>
                  <span className="text-sm font-medium">{row.platformName}</span>
                  <span className="text-sm text-muted">
                    {row._sum?.streamCount ?? 0} dinlenme ·{" "}
                    {formatMinorMoney(row._sum?.netRevenueMinor ?? BigInt(0), "USD")}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Mağazalar</p>
            <div className="mt-5 space-y-3">
              {dashboard.charts.storeDistribution.map((row) => (
                <div className="flex items-center justify-between rounded-2xl border bg-white/70 px-4 py-3" key={row.storeName}>
                  <span className="text-sm font-medium">{row.storeName}</span>
                  <span className="text-sm text-muted">
                    {row._sum?.streamCount ?? 0} dinlenme ·{" "}
                    {formatMinorMoney(row._sum?.netRevenueMinor ?? BigInt(0), "USD")}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">En iyi parçalar</p>
            <div className="mt-5 space-y-3">
              {dashboard.rankings.topTracks.map((row) => (
                <div className="rounded-2xl border bg-white/70 px-4 py-3" key={`${row.trackKey}-${row.trackTitle}`}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium">{row.trackTitle}</span>
                    <span className="text-sm text-muted">
                      {formatMinorMoney(row._sum?.netRevenueMinor ?? BigInt(0), "USD")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                    {row._sum?.streamCount ?? 0} dinlenme
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">En iyi yayınlar</p>
            <div className="mt-5 space-y-3">
              {dashboard.rankings.topReleases.map((row) => (
                <div className="rounded-2xl border bg-white/70 px-4 py-3" key={row.releaseTitle}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium">{row.releaseTitle}</span>
                    <span className="text-sm text-muted">
                      {formatMinorMoney(row._sum?.netRevenueMinor ?? BigInt(0), "USD")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                    {row._sum?.streamCount ?? 0} dinlenme
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel overflow-hidden p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted">Gelir satırları</p>
              <h2 className="mt-2 text-2xl font-semibold">Parça, tarih ve platform detayı</h2>
            </div>
            <p className="text-sm text-muted">En son 100 kayıt · yalnızca erişebildiğin sanatçılar</p>
          </div>
          {dashboard.details.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-line p-5 text-sm text-muted">
              Henüz gelir verisi aktarılmadı. Admin, OneRPM gelir dışa aktarımını içeri aldığında bu tablo otomatik dolar.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-2xl border border-line">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="bg-surface-strong text-xs uppercase tracking-[0.16em] text-muted">
                  <tr>
                    <th className="px-4 py-3">Tarih</th>
                    <th className="px-4 py-3">Sanatçı / parça</th>
                    <th className="px-4 py-3">Platform / ülke</th>
                    <th className="px-4 py-3">Dinlenme</th>
                    <th className="px-4 py-3 text-right">Net gelir</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.details.map((row) => (
                    <tr className="border-t border-line/70" key={row.id}>
                      <td className="whitespace-nowrap px-4 py-3">{row.reportDate.toLocaleDateString("tr-TR")}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{row.artist?.name ?? "Eşleşmemiş sanatçı"}</p>
                        <p className="mt-1 text-xs text-muted">{row.trackTitle} · {row.releaseTitle}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{row.platformName} · {row.storeName}</p>
                        <p className="mt-1 text-xs text-muted">{row.countryCode}</p>
                      </td>
                      <td className="px-4 py-3">{row.streamCount.toLocaleString("tr-TR")}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatMinorMoney(row.netRevenueMinor, row.currencyCode)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
