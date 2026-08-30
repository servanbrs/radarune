"use client";

import Link from "next/link";
import { Children, type CSSProperties, type ReactNode, useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Disc3,
  Globe2,
  Headphones,
  Radio,
  Rocket,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { AdminWorldMap } from "@/features/admin/components/admin-world-map";
import type { AdminV2Analytics } from "@/features/admin/server/services/admin-v2-analytics.service";

type Props = { dashboard: AdminV2Analytics };
type DelayStyle = CSSProperties & { "--admin-delay"?: string };
type BarStyle = CSSProperties & {
  "--admin-bar-height"?: string;
  "--admin-delay"?: string;
};

const countryNames: Record<string, string> = {
  TR: "Türkiye", DE: "Almanya", FR: "Fransa", GB: "Birleşik Krallık",
  US: "ABD", CA: "Kanada", BR: "Brezilya", MX: "Meksika", ES: "İspanya",
  IT: "İtalya", NL: "Hollanda", BE: "Belçika", SE: "İsveç", NO: "Norveç",
  PL: "Polonya", RU: "Rusya", IN: "Hindistan", JP: "Japonya", KR: "Güney Kore",
  AU: "Avustralya", ZA: "Güney Afrika", AE: "BAE",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Taslak", PENDING_REVIEW: "İncelemede", REVISION_REQUESTED: "Revizyon",
  APPROVED: "Onaylandı", REJECTED: "Reddedildi", QUEUED: "Kuyrukta",
  PROCESSING: "İşleniyor", DISTRIBUTED: "Dağıtıldı", LIVE: "Yayında",
  FAILED: "Başarısız", SUCCEEDED: "Başarılı", WAITING_PROVIDER: "Sağlayıcı bekleniyor",
  RETRY_SCHEDULED: "Tekrar denenecek", MANUAL_REVIEW: "Manuel inceleme",
};

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
  AdminSetting: "Yönetici ayarı", Release: "Yayın", DistributionJob: "Dağıtım işi",
  User: "Kullanıcı", Artist: "Sanatçı", Organization: "Organizasyon",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

function revealDelay(index: number): DelayStyle {
  return { "--admin-delay": `${Math.min(index * 70, 420)}ms` };
}

export function AdminV2Dashboard({ dashboard }: Props) {
  const maxTraffic = Math.max(
    1,
    ...dashboard.charts.dailyVisitors.map((item, index) =>
      Math.max(item.value, dashboard.charts.dailyUsers[index]?.value ?? 0),
    ),
  );
  const livePeople = [
    ...dashboard.details.liveVisitors,
    ...dashboard.details.activeSessions,
  ].filter(
    (session, index, items) =>
      items.findIndex(
        (candidate) =>
          session.userId
            ? candidate.userId === session.userId
            : !candidate.userId && candidate.id === session.id,
      ) === index,
  );

  const primaryMetrics = [
    { icon: Users, label: "Toplam kullanıcı", value: dashboard.summary.totalUsers, hint: "Kayıtlı hesap", href: "/admin/users" },
    { icon: Globe2, label: "Tekil ziyaretçi", value: dashboard.summary.totalVisitors, hint: "Tüm zamanlar", href: "/admin/analytics?view=visitors" },
    { icon: Radio, label: "Şu an aktif", value: dashboard.summary.activeUsers, hint: "Son 15 dakika", href: "/admin/analytics?view=active", live: true },
    { icon: UserPlus, label: "Bugünkü kayıt", value: dashboard.summary.usersToday, hint: `Son 7 gün ${formatNumber(dashboard.summary.usersSevenDays)}`, href: "/admin/analytics?view=registrations" },
  ];

  const dailyFlow = [
    { icon: Disc3, label: "Yeni yayın", value: dashboard.summary.releasesToday, detail: `${formatNumber(dashboard.summary.pendingReleases)} incelemede`, href: "/admin/releases" },
    { icon: Headphones, label: "Oynatma", value: dashboard.summary.playbackToday, detail: `${formatNumber(dashboard.summary.discoverEventsToday)} keşfet olayı`, href: "/admin/analytics?view=playback" },
    { icon: Rocket, label: "Dağıtım kuyruğu", value: dashboard.summary.activeDistributionJobs, detail: "Aktif işlem", href: "/admin/distribution/jobs" },
    { icon: UserCheck, label: "Başvuru", value: dashboard.summary.pendingApplications, detail: "İnceleme bekliyor", href: "/admin/applications" },
  ];

  return (
    <div data-admin-theme="dark" className="admin-overview min-w-0 max-w-full overflow-hidden bg-[#0b1020] text-[#f1f3f8]">
      <div className="mx-auto w-full min-w-0 max-w-[1680px] space-y-5 px-3 py-4 sm:px-5 sm:py-6 lg:px-7">
        <section className="admin-reveal relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#121a2b] px-5 py-6 shadow-[0_24px_75px_rgba(4,8,20,0.3)] sm:px-7 sm:py-7 lg:px-9">
          <div className="admin-ambient-orb pointer-events-none absolute -right-24 -top-40 size-[420px] rounded-full bg-[#d6a85f]/[0.12] blur-[100px]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#e5bd7b]">Radarune operasyon özeti</p>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#d6a85f]/25 bg-[#d6a85f]/[0.08] px-3 py-1 text-[10px] font-semibold text-[#e5bd7b]">
                  <span className="admin-live-dot size-1.5 rounded-full bg-[#d6a85f]" /> Canlı
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">Bugün platformda neler oluyor?</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#b7c2d0]">Kullanıcı hareketi, yayın akışı ve bekleyen operasyonlar tek bir sade görünümde.</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#1b2438] px-4 py-2 text-xs text-[#b7c2d0]">
                <Clock3 className="size-4 text-[#e5bd7b]" />
                Güncellendi: {new Date(dashboard.generatedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <Link className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d6a85f] px-4 py-2 text-xs font-bold !text-[#17120b] transition hover:bg-[#e5bd7b]" href="/admin/analytics">
                Tüm analizler <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <section aria-label="Ana platform metrikleri" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {primaryMetrics.map((metric, index) => <MetricCard {...metric} index={index} key={metric.label} />)}
        </section>

        <section aria-labelledby="daily-flow-heading" className="admin-reveal rounded-[26px] border border-white/[0.08] bg-[#11182a] p-4 sm:p-5" style={revealDelay(4)}>
          <div className="flex flex-col gap-2 border-b border-white/[0.07] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e5bd7b]">Bugünün akışı</p><h2 id="daily-flow-heading" className="mt-1 text-lg font-semibold text-white">Hızlı operasyon kontrolü</h2></div>
            <p className="text-xs text-[#8f9aad]">Detay için bir metriğe dokun</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {dailyFlow.map((item) => (
              <Link className="group flex min-w-0 items-center gap-3 rounded-2xl border border-transparent bg-[#182137] px-4 py-3 transition hover:border-[#d6a85f]/30 hover:bg-[#202b44]" href={item.href} key={item.label}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#d6a85f]/10 text-[#e5bd7b]"><item.icon className="size-4.5" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-xs text-[#9da8ba]">{item.label}</span><span className="mt-0.5 block truncate text-sm font-semibold text-white"><AnimatedNumber value={item.value} /> · {item.detail}</span></span>
                <ArrowUpRight className="size-4 shrink-0 text-[#69758a] transition group-hover:text-[#e5bd7b]" />
              </Link>
            ))}
          </div>
        </section>

        <section className="grid min-w-0 items-stretch gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.65fr)]">
          <article className="admin-reveal min-w-0 rounded-[28px] border border-white/[0.08] bg-[#151c2d] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.18)] sm:p-6" style={revealDelay(5)}>
            <SectionHeading eyebrow="30 günlük hareket" title="Ziyaret ve yeni kayıtlar" icon={Activity} />
            <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-[#9da8ba]"><span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-[#d6a85f]" /> Tekil ziyaretçi</span><span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-[#718096]" /> Yeni kayıt</span></div>
            <div className="mt-6 flex h-[220px] min-w-0 items-end gap-1 sm:gap-1.5">
              {dashboard.charts.dailyVisitors.map((item, index) => {
                const registrations = dashboard.charts.dailyUsers[index]?.value ?? 0;
                const visitorHeight = Math.max(3, (item.value / maxTraffic) * 100);
                const registrationHeight = Math.max(2, (registrations / maxTraffic) * 100);
                const barStyle: BarStyle = { "--admin-bar-height": `${visitorHeight}%`, "--admin-delay": `${index * 24}ms` };
                const registrationStyle: BarStyle = { "--admin-bar-height": `${registrationHeight}%`, "--admin-delay": `${index * 24 + 80}ms` };
                return (
                  <div className="group relative flex h-full min-w-0 flex-1 items-end justify-center gap-px" key={item.date}>
                    <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-[#0d1324] px-2.5 py-1.5 text-[10px] text-white shadow-xl group-hover:block">{item.label}: {item.value} ziyaret · {registrations} kayıt</div>
                    <div className="admin-chart-bar w-[52%] max-w-3 rounded-t-md bg-gradient-to-t from-[#9a6a2f] to-[#e5bd7b]" style={barStyle} />
                    <div className="admin-chart-bar w-[30%] max-w-2 rounded-t-md bg-[#718096]" style={registrationStyle} />
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3 text-[11px] text-[#7f8a9d]"><span>{dashboard.charts.dailyVisitors[0]?.label ?? "30 gün önce"}</span><span>Bugün</span></div>
          </article>

          <AnalyticsPreview eyebrow="Canlı görünüm" title={`${formatNumber(livePeople.length)} kişi platformda`} href="/admin/analytics?view=active" empty="Son 15 dakikada aktif oturum yok." delay={6}>
            {livePeople.slice(0, 6).map((session, index) => (
              <div className="admin-list-row flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#1b2438] p-3" style={revealDelay(index)} key={`${session.id}-${index}`}>
                <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-[#263149] text-xs font-bold text-[#e5bd7b]">{(session.name || "A").slice(0, 1).toUpperCase()}<span className="admin-live-dot absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#1b2438] bg-[#d6a85f]" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-white">{session.name}</span><span className="mt-0.5 block truncate text-[11px] text-[#8f9aad]">{session.city}, {session.country} · {"path" in session ? session.path : "Aktif oturum"}</span></span>
                <span className="rounded-full bg-[#d6a85f]/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#e5bd7b]">Aktif</span>
              </div>
            ))}
          </AnalyticsPreview>
        </section>

        <section className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.55fr)]">
          <article className="admin-reveal min-w-0 overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#121a2b] p-5 shadow-[0_20px_65px_rgba(0,0,0,0.22)] sm:p-6" style={revealDelay(7)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><SectionHeading eyebrow="Coğrafi görünüm" title="Canlı kullanıcı ve müzik hareketi" icon={Globe2} /><p className="max-w-xs text-xs leading-5 text-[#8f9aad]">Ülkenin üzerine gelerek aktif kullanıcıları ve şehirleri gör.</p></div>
            <AdminWorldMap countries={dashboard.charts.countries} activeSessions={livePeople} />
            {dashboard.charts.countries.length ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{dashboard.charts.countries.slice(0, 4).map((country) => <div className="rounded-2xl border border-white/[0.06] bg-[#1b2438] px-3 py-3" key={country.code}><p className="truncate text-xs text-[#9da8ba]">{countryNames[country.code] ?? country.code}</p><p className="mt-1 text-sm font-semibold text-white">{formatNumber(country.streams)} stream</p><p className="mt-1 text-[10px] text-[#e5bd7b]">{country.liveVisitors} canlı ziyaretçi</p></div>)}</div>
            ) : <p className="mt-4 rounded-2xl border border-white/[0.06] bg-[#1b2438] p-4 text-sm text-[#9da8ba]">Ülke verisi geldikçe harita otomatik renklenecek.</p>}
          </article>

          <article className="admin-reveal rounded-[28px] border border-white/[0.08] bg-[#151c2d] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.18)] sm:p-6" style={revealDelay(8)}>
            <SectionHeading eyebrow="Son hareketler" title="Yönetim akışı" icon={CheckCircle2} />
            <div className="mt-5 space-y-2">
              {dashboard.recentActivities.slice(0, 7).map((activity, index) => <div className="admin-list-row flex items-start gap-3 rounded-2xl border border-white/[0.05] bg-[#1b2438] p-3" style={revealDelay(index)} key={activity.id}><span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#d6a85f]" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{activityActionLabels[activity.action] ?? activity.action.replaceAll("_", " ")}</p><p className="mt-1 truncate text-[10px] text-[#8f9aad]">{activity.actor} · {activityEntityLabels[activity.entityType] ?? activity.entityType}</p></div><time className="shrink-0 text-[9px] text-[#69758a]">{new Date(activity.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</time></div>)}
              {!dashboard.recentActivities.length ? <p className="rounded-2xl border border-white/[0.06] bg-[#1b2438] p-4 text-sm text-[#9da8ba]">Henüz yönetim hareketi bulunmuyor.</p> : null}
            </div>
          </article>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-3">
          <StatusPanel title="Yayın durumları" items={dashboard.charts.releaseStatuses} href="/admin/releases" delay={9} />
          <StatusPanel title="Dağıtım durumları" items={dashboard.charts.distributionStatuses} href="/admin/distribution/jobs" delay={10} />
          <AnalyticsPreview eyebrow="İşlem bekliyor" title="Dağıtım kuyruğu" href="/admin/distribution/jobs" empty="Bekleyen dağıtım işi yok." delay={11}>
            {dashboard.details.distributionQueue.slice(0, 6).map((job) => <Link className="group flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-[#1b2438] p-3 transition hover:border-[#d6a85f]/30" href={`/admin/distribution/jobs/${job.id}`} key={job.id}><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{job.releaseTitle}</p><p className="mt-1 truncate text-[11px] text-[#8f9aad]">{job.provider} · Deneme {job.attemptCount}/{job.maxRetryCount}</p></div><span className="shrink-0 rounded-full bg-[#d6a85f]/10 px-2 py-1 text-[10px] font-semibold text-[#e5bd7b]">{statusLabels[job.status] ?? job.status}</span></Link>)}
          </AnalyticsPreview>
        </section>
      </div>
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const reducedMotionFrame = requestAnimationFrame(() => setDisplayValue(value));
      return () => cancelAnimationFrame(reducedMotionFrame);
    }
    const duration = 700;
    const startedAt = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      setDisplayValue(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{formatNumber(displayValue)}</>;
}

function MetricCard({ icon: Icon, label, value, hint, href, live = false, index }: { icon: typeof Users; label: string; value: number; hint: string; href: string; live?: boolean; index: number }) {
  return <Link className="admin-reveal group min-w-0 rounded-[24px] border border-white/[0.08] bg-[#151c2d] p-5 shadow-[0_14px_42px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:border-[#d6a85f]/35 hover:bg-[#1b2438]" href={href} style={revealDelay(index + 1)}><div className="flex items-start justify-between gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#d6a85f]/10 text-[#e5bd7b]"><Icon className="size-4.5" /></span><span className="flex items-center gap-2 text-[10px] font-semibold text-[#7f8a9d]">{live ? <span className="admin-live-dot size-1.5 rounded-full bg-[#d6a85f]" /> : null}{hint}</span></div><p className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-white"><AnimatedNumber value={value} /></p><div className="mt-2 flex items-center justify-between gap-3"><p className="truncate text-sm font-semibold text-[#dce2ec]">{label}</p><ArrowUpRight className="size-4 shrink-0 text-[#69758a] transition group-hover:text-[#e5bd7b]" /></div></Link>;
}

function AnalyticsPreview({ eyebrow, title, href, empty, children, delay }: { eyebrow: string; title: string; href: string; empty: string; children: ReactNode; delay: number }) {
  return <article className="admin-reveal rounded-[28px] border border-white/[0.08] bg-[#151c2d] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.18)] sm:p-6" style={revealDelay(delay)}><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e5bd7b]">{eyebrow}</p><h2 className="mt-2 truncate text-xl font-semibold tracking-[-0.03em] text-white">{title}</h2></div><Link aria-label={`${title} ayrıntılarını aç`} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-[#1b2438] text-[#e5bd7b] transition hover:border-[#d6a85f]/40 hover:bg-[#202b44]" href={href}><ArrowUpRight className="size-4" /></Link></div><div className="mt-5 space-y-2">{Children.count(children) ? children : <p className="rounded-2xl border border-white/[0.06] bg-[#1b2438] p-4 text-sm text-[#9da8ba]">{empty}</p>}</div></article>;
}

function SectionHeading({ eyebrow, title, icon: Icon }: { eyebrow: string; title: string; icon: typeof Users }) {
  return <div className="flex min-w-0 items-center justify-between gap-4"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e5bd7b]">{eyebrow}</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-white">{title}</h2></div><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#d6a85f]/10 text-[#e5bd7b]"><Icon className="size-4.5" /></div></div>;
}

function StatusPanel({ title, items, href, delay }: { title: string; items: Array<{ name: string; value: number }>; href: string; delay: number }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return <article className="admin-reveal rounded-[28px] border border-white/[0.08] bg-[#151c2d] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.18)] sm:p-6" style={revealDelay(delay)}><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e5bd7b]">Operasyon</p><h2 className="mt-2 text-xl font-semibold text-white">{title}</h2></div><Link className="flex size-10 items-center justify-center rounded-full border border-white/[0.08] bg-[#1b2438] text-[#e5bd7b]" href={href}><ArrowUpRight className="size-4" /></Link></div><div className="mt-6 space-y-4">{items.slice(0, 6).map((item, index) => { const width = `${Math.max(4, (item.value / max) * 100)}%`; return <div key={item.name}><div className="flex items-center justify-between gap-3 text-xs"><span className="truncate font-semibold text-[#c7cfdd]">{statusLabels[item.name] ?? item.name}</span><span className="text-[#8f9aad]">{formatNumber(item.value)}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="admin-status-bar h-full rounded-full bg-gradient-to-r from-[#9a6a2f] to-[#e5bd7b]" style={{ "--admin-bar-width": width, "--admin-delay": `${index * 80}ms` } as CSSProperties} /></div></div>; })}{!items.length ? <p className="rounded-2xl border border-white/[0.06] bg-[#1b2438] p-4 text-sm text-[#9da8ba]">Henüz veri bulunmuyor.</p> : null}</div></article>;
}
