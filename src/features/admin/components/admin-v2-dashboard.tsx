import Link from "next/link";
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

export function AdminV2Dashboard({ dashboard }: Props) {
  const maxUsers = Math.max(
    1,
    ...dashboard.charts.dailyUsers.map((item) => item.value),
  );

  const maxCountryStreams = Math.max(
    1,
    ...dashboard.charts.countries.map((item) => item.streams),
  );

  const visibleCountries = dashboard.charts.countries.filter(
    (country) => countryCoordinates[country.code],
  );

  return (
    <main className="min-h-screen bg-[#f3f5f4] text-[#101817]">
      <div className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] bg-[#101817] px-6 py-8 text-white shadow-[0_28px_90px_rgba(15,23,42,0.2)] sm:px-9 lg:px-11">
          <div className="pointer-events-none absolute -right-24 -top-36 size-[430px] rounded-full bg-emerald-400/20 blur-[100px]" />

          <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
                Radarune Admin V2
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

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            icon={UserCheck}
            label="Aktif kullanıcı"
            value={dashboard.summary.activeUsers}
            hint="Son 15 dakika"
          />

          <MetricCard
            icon={UserPlus}
            label="Bugünkü kayıt"
            value={dashboard.summary.usersToday}
            hint={`7 gün: ${formatNumber(dashboard.summary.usersSevenDays)}`}
          />

          <MetricCard
            icon={Disc3}
            label="Bugünkü yayın"
            value={dashboard.summary.releasesToday}
            hint={`Bekleyen: ${formatNumber(
              dashboard.summary.pendingReleases,
            )}`}
          />

          <MetricCard
            icon={Headphones}
            label="Bugünkü oynatma"
            value={dashboard.summary.playbackToday}
            hint={`Keşfet olayı: ${formatNumber(
              dashboard.summary.discoverEventsToday,
            )}`}
          />

          <MetricCard
            icon={Rocket}
            label="Dağıtım kuyruğu"
            value={dashboard.summary.activeDistributionJobs}
            hint={`Başvuru: ${formatNumber(
              dashboard.summary.pendingApplications,
            )}`}
          />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,.8fr)]">
          <article className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.07)] sm:p-6">
            <SectionHeading
              eyebrow="Kullanıcı analizi"
              title="Son 30 gün yeni kullanıcılar"
              icon={Users}
            />

            <div className="mt-8 flex h-[280px] items-end gap-1.5 sm:gap-2">
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

            <div className="mt-4 flex items-center justify-between text-xs text-[#8b9693]">
              <span>{dashboard.charts.dailyUsers[0]?.label}</span>

              <span>Bugün</span>
            </div>
          </article>

          <article className="overflow-hidden rounded-[28px] border border-black/[0.06] bg-[#101817] p-5 text-white shadow-[0_20px_65px_rgba(15,23,42,0.18)] sm:p-6">
            <SectionHeading
              dark
              eyebrow="Global dağılım"
              title="Ülke bazlı müzik aktivitesi"
              icon={Globe2}
            />

            <WorldMap
              countries={visibleCountries}
              maxStreams={maxCountryStreams}
            />

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
                </div>
              ))}
            </div>

            {!dashboard.charts.countries.length ? (
              <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/50">
                Henüz ülke bazlı royalty/stream verisi bulunmuyor.
              </p>
            ) : null}
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

          <article className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.07)] sm:p-6">
            <SectionHeading
              eyebrow="Canlı kayıt"
              title="Son yönetim aktiviteleri"
              icon={Activity}
            />

            <div className="mt-5 space-y-3">
              {dashboard.recentActivities.map((activity) => (
                <div
                  className="flex items-start gap-3 rounded-2xl bg-[#f7f9f8] p-3.5"
                  key={activity.id}
                >
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-500" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {activity.action}
                    </p>

                    <p className="mt-1 truncate text-xs text-[#8b9693]">
                      {activity.actor} · {activity.entityType}
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
                <p className="rounded-2xl bg-[#f7f9f8] p-4 text-sm text-[#65706e]">
                  Henüz yönetim aktivitesi bulunmuyor.
                </p>
              ) : null}
            </div>
          </article>
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
}: {
  icon: typeof Users;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <article className="rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-[0_14px_42px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[#101817] text-white">
          <Icon className="size-5" />
        </div>

        <ArrowUpRight className="size-4 text-[#9aa4a2]" />
      </div>

      <p className="mt-5 text-3xl font-semibold tracking-[-0.05em]">
        {formatNumber(value)}
      </p>

      <p className="mt-1 text-sm font-semibold">{label}</p>

      <p className="mt-2 text-xs text-[#8b9693]">{hint}</p>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  icon: Icon,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  icon: typeof Users;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
            dark ? "text-emerald-300" : "text-emerald-700"
          }`}
        >
          {eyebrow}
        </p>

        <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
          {title}
        </h2>
      </div>

      <div
        className={`flex size-11 items-center justify-center rounded-2xl ${
          dark
            ? "bg-white/10 text-emerald-300"
            : "bg-emerald-500/10 text-emerald-700"
        }`}
      >
        <Icon className="size-5" />
      </div>
    </div>
  );
}

function WorldMap({
  countries,
  maxStreams,
}: {
  countries: AdminV2Analytics["charts"]["countries"];
  maxStreams: number;
}) {
  return (
    <div className="relative mt-6 aspect-[2/1] overflow-hidden rounded-[22px] border border-white/10 bg-[#16201e]">
      <svg
        aria-label="Dünya aktivite haritası"
        className="absolute inset-0 size-full"
        viewBox="0 0 1000 500"
      >
        <g fill="#263330" stroke="#394945" strokeWidth="2">
          <path d="M70 110L160 70L250 95L285 150L245 210L195 200L165 250L105 220L75 165Z" />
          <path d="M235 250L285 270L315 345L285 445L240 380L215 310Z" />
          <path d="M410 90L505 65L555 105L540 155L490 170L455 145L420 155L390 125Z" />
          <path d="M430 175L520 165L565 235L545 350L500 425L450 360L420 260Z" />
          <path d="M540 90L705 70L845 115L900 180L840 235L750 225L690 285L620 250L570 170Z" />
          <path d="M755 300L840 285L910 335L890 410L820 425L760 375Z" />
        </g>

        {countries.map((country) => {
          const coordinate = countryCoordinates[country.code];

          if (!coordinate) {
            return null;
          }

          const radius = 5 + (country.streams / maxStreams) * 13;

          return (
            <g key={country.code}>
              <circle
                cx={coordinate.x * 10}
                cy={coordinate.y * 5}
                fill="rgba(52,211,153,.18)"
                r={radius + 8}
              />

              <circle
                cx={coordinate.x * 10}
                cy={coordinate.y * 5}
                fill="#34d399"
                r={radius}
              />

              <title>
                {coordinate.name}: {formatNumber(country.streams)} stream
              </title>
            </g>
          );
        })}
      </svg>
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
    <article className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.07)] sm:p-6">
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
              <span className="truncate font-semibold text-[#52605d]">
                {statusLabels[item.name] ?? item.name}
              </span>

              <span className="text-[#8b9693]">{formatNumber(item.value)}</span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/[0.05]">
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
          <p className="rounded-2xl bg-[#f7f9f8] p-4 text-sm text-[#65706e]">
            Henüz veri bulunmuyor.
          </p>
        ) : null}
      </div>
    </article>
  );
}
