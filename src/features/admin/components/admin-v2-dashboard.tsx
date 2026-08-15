import Link from "next/link";
import { Children, type ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  Clock3,
  Disc3,
  Globe2,
  Headphones,
  Rocket,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import type { AdminV2Analytics } from "@/features/admin/server/services/admin-v2-analytics.service";
import { AdminWorldMap } from "@/features/admin/components/admin-world-map";

type Props = {
  dashboard: AdminV2Analytics;
};

const countryCoordinates: Record<
  string,
  { x: number; y: number; name: string }
> = {
  TR: { x: 55, y: 37, name: "Türkiye" },
  DE: { x: 49, y: 29, name: "Almanya" },
  FR: { x: 46, y: 32, name: "Fransa" },
  GB: { x: 43, y: 26, name: "Birleşik Krallık" },
  US: { x: 20, y: 34, name: "ABD" },
  CA: { x: 18, y: 23, name: "Kanada" },
  BR: { x: 31, y: 65, name: "Brezilya" },
  MX: { x: 20, y: 48, name: "Meksika" },
  ES: { x: 44, y: 38, name: "İspanya" },
  IT: { x: 50, y: 38, name: "İtalya" },
  NL: { x: 48, y: 27, name: "Hollanda" },
  BE: { x: 47, y: 30, name: "Belçika" },
  SE: { x: 51, y: 18, name: "İsveç" },
  NO: { x: 48, y: 17, name: "Norveç" },
  PL: { x: 53, y: 28, name: "Polonya" },
  RU: { x: 66, y: 23, name: "Rusya" },
  IN: { x: 69, y: 49, name: "Hindistan" },
  JP: { x: 86, y: 39, name: "Japonya" },
  KR: { x: 82, y: 41, name: "Güney Kore" },
  AU: { x: 84, y: 71, name: "Avustralya" },
  ZA: { x: 56, y: 72, name: "Güney Afrika" },
  AE: { x: 63, y: 46, name: "BAE" },
};

const statusLabels: Record<string, string> = {
  DRAFT: "Taslak",
  PENDING_REVIEW: "İncelemede",
  REVISION_REQUESTED: "Revizyon",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  QUEUED: "Kuyrukta",
  PROCESSING: "İşleniyor",
  DISTRIBUTED: "Dağıtıldı",
  LIVE: "Yayında",
  FAILED: "Başarısız",
  SUCCEEDED: "Başarılı",
  WAITING_PROVIDER: "Sağlayıcı bekleniyor",
  RETRY_SCHEDULED: "Tekrar denenecek",
  MANUAL_REVIEW: "Manuel inceleme",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

const activityActionLabels: Record<string, string> = {
  ADMIN_SETTING_UPDATED: "Yönetici ayarı güncellendi",
  RELEASE_CREATED: "Yayın oluşturuldu",
  RELEASE_UPDATED: "Yayın güncellendi",
  RELEASE_APPROVED: "Yayın onaylandı",
  RELEASE_REJECTED: "Yayın reddedildi",
  DISTRIBUTION_JOB_CREATED: "Dağıtım işi oluşturuldu",
  DISTRIBUTION_JOB_UPDATED: "Dağıtım işi güncellendi",
  USER_CREATED: "Kullanıcı oluşturuldu",
  USER_UPDATED: "Kullanıcı güncellendi",
};

const activityEntityLabels: Record<string, string> = {
  AdminSetting: "Yönetici ayarı",
  Release: "Yayın",
  DistributionJob: "Dağıtım işi",
  User: "Kullanıcı",
  Artist: "Sanatçı",
  Organization: "Organizasyon",
};

export function AdminV2Dashboard({ dashboard }: Props) {
  const maxUsers = Math.max(
    1,
    ...dashboard.charts.dailyUsers.map((item) => item.value),
  );

  return (
    <main data-admin-theme="dark" className="min-h-screen bg-[#0b1020] text-[#f1f3f8]">
      <div className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] bg-[#121a2b] px-6 py-8 text-white shadow-[0_28px_90px_rgba(4,8,20,0.35)] sm:px-9 lg:px-11">
          <div className="pointer-events-none absolute -right-24 -top-36 size-[430px] rounded-full bg-emerald-400/20 blur-[100px]" />

          <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
                Radarune Admin
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
                Platform kontrol merkezi
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
                Kullanıcı, yayın, keşfet ve dağıtım operasyonlarının gerçek
                zamanlı görünümü.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs text-white/60">
              <Clock3 className="size-4 text-emerald-300" />
              Son hesaplama:{" "}
              {new Date(dashboard.generatedAt).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard
            icon={Users}
            label="Toplam kullanıcı"
            value={dashboard.summary.totalUsers}
            hint="Kayıtlı aktif hesaplar"
            href="/admin/users"
          />
          <MetricCard
            icon={UserCheck}
            label="Aktif kullanıcı"
            value={dashboard.summary.activeUsers}
            hint="Son 15 dakika"
            href="/admin/analytics?view=active"
          />

          <MetricCard
            icon={UserPlus}
            label="Bugünkü kayıt"
            value={dashboard.summary.usersToday}
            hint={`7 gün: ${formatNumber(dashboard.summary.usersSevenDays)}`}
            href="/admin/analytics?view=registrations"
          />

          <MetricCard
            icon={Disc3}
            label="Bugünkü yayın"
            value={dashboard.summary.releasesToday}
            hint={`Bekleyen: ${formatNumber(
              dashboard.summary.pendingReleases,
            )}`}
            href="/admin/analytics?view=releases"
          />

          <MetricCard
            icon={Headphones}
            label="Bugünkü oynatma"
            value={dashboard.summary.playbackToday}
            hint={`Keşfet olayı: ${formatNumber(
              dashboard.summary.discoverEventsToday,
            )}`}
            href="/admin/analytics?view=playback"
          />

          <MetricCard
            icon={Rocket}
            label="Dağıtım kuyruğu"
            value={dashboard.summary.activeDistributionJobs}
            hint={`Başvuru: ${formatNumber(
              dashboard.summary.pendingApplications,
            )}`}
            href="/admin/distribution/jobs"
          />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(320px,.72fr)_minmax(0,1.28fr)]">
          <article className="rounded-[28px] border border-white/[0.08] bg-[#151c2d] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.2)] sm:p-6">
            <SectionHeading
              eyebrow="Kullanıcı analizi"
              title="Son 30 gün yeni kullanıcılar"
              icon={Users}
            />

            <div className="mt-8 flex h-[180px] items-end gap-1.5 sm:gap-2">
              {dashboard.charts.dailyUsers.map((item) => {
                const height = Math.max(4, (item.value / maxUsers) * 100);

                return (
                  <div
                    className="group flex h-full min-w-0 flex-1 flex-col justify-end"
                    key={item.date}
                  >
                    <div className="pointer-events-none mb-2 hidden rounded-lg bg-[#101817] px-2 py-1 text-center text-[10px] text-white group-hover:block">
                      {item.label}: {item.value}
                    </div>

                    <div
                      className="min-h-1 rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-300 transition group-hover:brightness-110"
                      style={{
                        height: `${height}%`,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-white/45">
              <span>{dashboard.charts.dailyUsers[0]?.label}</span>

              <span>Bugün</span>
            </div>
          </article>

          <article className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#121a2b] p-5 text-white shadow-[0_20px_65px_rgba(0,0,0,0.25)] sm:p-6">
            <SectionHeading
              eyebrow="Global dağılım"
              title="Ülke bazlı müzik aktivitesi"
              icon={Globe2}
            />

            <AdminWorldMap countries={dashboard.charts.countries} />

            <div className="mt-5 grid grid-cols-2 gap-2">
              {dashboard.charts.countries.slice(0, 6).map((country) => (
                <div
                  className="rounded-2xl bg-white/[0.06] px-3 py-3"
                  key={country.code}
                >
                  <p className="text-xs text-white/40">
                    {countryCoordinates[country.code]?.name ?? country.code}
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {formatNumber(country.streams)} stream
                  </p>
                  {country.royaltyMinor > 0 ? (
                    <p className="mt-1 text-xs text-emerald-300">
                      Royalty: {(country.royaltyMinor / 100).toLocaleString("tr-TR", { style: "currency", currency: "EUR" })}
                    </p>
                  ) : null}
                  {country.liveVisitors > 0 ? (
                    <p className="mt-1 text-xs text-white/45">
                      {country.liveVisitors} canlı ziyaretçi
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            {!dashboard.charts.countries.length ? (
              <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/50">
                Henüz ülke bazlı royalty/stream verisi bulunmuyor.
              </p>
            ) : null}
            <p className="mt-4 text-[11px] leading-5 text-white/35">
              Canlı ziyaretçiler son 15 dakikadaki anonim Smart Link ziyaretleridir. Ham IP adresi saklanmaz.
            </p>
          </article>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-3">
          <StatusPanel
            title="Yayın durumları"
            items={dashboard.charts.releaseStatuses}
            href="/admin/releases"
          />

          <StatusPanel
            title="Dağıtım durumları"
            items={dashboard.charts.distributionStatuses}
            href="/admin/distribution/jobs"
          />

          <article className="rounded-[28px] border border-white/[0.08] bg-[#122421] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.2)] sm:p-6">
            <SectionHeading
              eyebrow="Canlı kayıt"
              title="Son yönetim aktiviteleri"
              icon={Activity}
            />

            <div className="mt-5 space-y-3">
              {dashboard.recentActivities.map((activity) => (
                <div
                  className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-[#1b2438] p-3.5"
                  key={activity.id}
                >
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-500" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {activityActionLabels[activity.action] ?? activity.action.replaceAll("_", " ")}
                    </p>

                    <p className="mt-1 truncate text-xs text-white/45">
                      {activity.actor} · {activityEntityLabels[activity.entityType] ?? activity.entityType}
                    </p>
                  </div>

                  <time className="shrink-0 text-[10px] text-[#9aa4a2]">
                    {new Date(activity.createdAt).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              ))}

              {!dashboard.recentActivities.length ? (
                <p className="rounded-2xl border border-white/[0.06] bg-[#1b2438] p-4 text-sm text-white/55">
                  Henüz yönetim aktivitesi bulunmuyor.
                </p>
              ) : null}
            </div>
          </article>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-2">
          <AnalyticsPreview
            title="Şu an aktif kullanıcılar"
            eyebrow="Canlı oturumlar"
            href="/admin/analytics?view=active"
            empty="Son 15 dakikada aktif oturum yok."
          >
            {dashboard.details.activeSessions.slice(0, 6).map((session) => (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-[#1b2438] p-3" key={session.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{session.name}</p>
                  <p className="truncate text-xs text-white/45">{session.email} · {session.ipAddress}</p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-300/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">Aktif</span>
              </div>
            ))}
          </AnalyticsPreview>

          <AnalyticsPreview
            title="Dağıtım kuyruğu"
            eyebrow="İşlem bekleyen yayınlar"
            href="/admin/distribution/jobs"
            empty="Bekleyen dağıtım işi yok."
          >
            {dashboard.details.distributionQueue.slice(0, 6).map((job) => (
                <Link className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-[#1b2438] p-3 transition hover:border-emerald-300/30" href={`/admin/distribution/jobs/${job.id}`} key={job.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{job.releaseTitle}</p>
                  <p className="truncate text-xs text-white/45">{job.provider} · Deneme {job.attemptCount}/{job.maxRetryCount}</p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-300/10 px-2 py-1 text-[10px] font-semibold text-amber-200">{statusLabels[job.status] ?? job.status}</span>
              </Link>
            ))}
          </AnalyticsPreview>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  hint: string;
  href: string;
}) {
  return (
    <Link className="group rounded-[24px] border border-white/[0.08] bg-[#151c2d] p-5 shadow-[0_14px_42px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:border-emerald-300/30 hover:bg-[#202b44]" href={href}>
      <div className="flex items-center justify-between">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[#101817] text-white">
          <Icon className="size-5" />
        </div>

        <ArrowUpRight className="size-4 text-[#9aa4a2]" />
      </div>

      <p className="mt-5 text-3xl font-semibold tracking-[-0.05em]">
        {formatNumber(value)}
      </p>

      <p className="mt-1 text-sm font-semibold text-white">{label}</p>

      <p className="mt-2 text-xs text-white/45">{hint}</p>
    </Link>
  );
}

function AnalyticsPreview({
  eyebrow,
  title,
  href,
  empty,
  children,
}: {
  eyebrow: string;
  title: string;
  href: string;
  empty: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-[28px] border border-white/[0.08] bg-[#151c2d] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.2)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-semibold">{title}</h2>
        </div>
        <Link aria-label={`${title} ayrıntılarını aç`} className="flex size-10 items-center justify-center rounded-full bg-[#101817] text-white transition hover:bg-emerald-300 hover:text-[#0d211d]" href={href}><ArrowUpRight className="size-4" /></Link>
      </div>
      <div className="mt-5 space-y-2">
        {Children.count(children) ? children : <p className="rounded-2xl border border-white/[0.06] bg-[#1b2438] p-4 text-sm text-white/55">{empty}</p>}
      </div>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  icon: typeof Users;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
            "text-emerald-300"
          }`}
        >
          {eyebrow}
        </p>

        <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-white">
          {title}
        </h2>
      </div>

      <div
        className={`flex size-11 items-center justify-center rounded-2xl ${
          "bg-emerald-300/10 text-emerald-300"
        }`}
      >
        <Icon className="size-5" />
      </div>
    </div>
  );
}

function StatusPanel({
  title,
  items,
  href,
}: {
  title: string;
  items: Array<{ name: string; value: number }>;
  href: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <article className="rounded-[28px] border border-white/[0.08] bg-[#151c2d] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.2)] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
            Operasyon
          </p>

          <h2 className="mt-2 text-xl font-semibold">{title}</h2>
        </div>

        <Link
          className="flex size-10 items-center justify-center rounded-full bg-[#101817] text-white"
          href={href}
        >
          <ArrowUpRight className="size-4" />
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {items.slice(0, 6).map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-semibold text-white/70">
                {statusLabels[item.name] ?? item.name}
              </span>

              <span className="text-white/45">{formatNumber(item.value)}</span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-300"
                style={{
                  width: `${Math.max(4, (item.value / max) * 100)}%`,
                }}
              />
            </div>
          </div>
        ))}

        {!items.length ? (
          <p className="rounded-2xl border border-white/[0.06] bg-[#1b2438] p-4 text-sm text-white/55">
            Henüz veri bulunmuyor.
          </p>
        ) : null}
      </div>
    </article>
  );
}
