import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  Disc3,
  Download,
  Headphones,
  Lightbulb,
  Music2,
  Plus,
  Radio,
  Sparkles,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

type DashboardData = {
  stats: {
    totalReleases: number;
    liveReleases: number;
    draftReleases: number;
    pendingReviewReleases: number;
    revisionReleases: number;
    failedDistributionJobs: number;
    streams: number;
    downloads: number;
    playlistAppearances: number;
    netRevenueMinor: bigint;
  };
  recentReleases: Array<{
    id: string;
    title: string;
    status: string;
    artworkUploadId: string | null;
    plannedReleaseDate: Date | null;
    updatedAt: Date;
    artists: Array<{
      artist: {
        id: string;
        name: string;
      };
    }>;
  }>;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: Date;
    actorUser: {
      id: string;
      name: string;
      email: string;
    } | null;
  }>;
};

type DashboardOverviewProps = {
  artistsCount: number;
  data: DashboardData;
  labelsCount: number;
  organizationName: string;
  userName: string;
};

type MetricCardProps = {
  description: string;
  icon: LucideIcon;
  label: string;
  value: string;
};

type QuickAction = {
  description: string;
  href: string;
  icon: LucideIcon;
  title: string;
};

const compactNumberFormatter = new Intl.NumberFormat("tr-TR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const relativeDateFormatter = new Intl.RelativeTimeFormat("tr-TR", {
  numeric: "auto",
});

const statusLabels: Record<string, string> = {
  DRAFT: "Taslak",
  PENDING_REVIEW: "İncelemede",
  REVISION_REQUESTED: "Düzenleme gerekli",
  APPROVED: "Onaylandı",
  QUEUED: "Dağıtım sırasında",
  LIVE: "Yayında",
  REJECTED: "Reddedildi",
};

const auditActionLabels: Record<string, string> = {
  RELEASE_CREATED: "Yeni yayın oluşturuldu",
  RELEASE_UPDATED: "Yayın güncellendi",
  RELEASE_SUBMITTED: "Yayın incelemeye gönderildi",
  RELEASE_APPROVED: "Yayın onaylandı",
  RELEASE_REJECTED: "Yayın reddedildi",
  USER_CREATED: "Yeni kullanıcı oluşturuldu",
  USER_UPDATED: "Kullanıcı bilgileri güncellendi",
  ARTIST_CREATED: "Yeni sanatçı oluşturuldu",
  ARTIST_UPDATED: "Sanatçı bilgileri güncellendi",
  DISTRIBUTION_CREATED: "Dağıtım işlemi oluşturuldu",
  DISTRIBUTION_FAILED: "Dağıtım işlemi başarısız oldu",
};

function formatCurrencyFromMinor(value: bigint) {
  return currencyFormatter.format(Number(value) / 100);
}

function formatRelativeDate(date: Date) {
  const difference = date.getTime() - Date.now();
  const minutes = Math.round(difference / 60_000);

  if (Math.abs(minutes) < 60) {
    return relativeDateFormatter.format(minutes, "minute");
  }

  const hours = Math.round(minutes / 60);

  if (Math.abs(hours) < 24) {
    return relativeDateFormatter.format(hours, "hour");
  }

  const days = Math.round(hours / 24);

  if (Math.abs(days) < 7) {
    return relativeDateFormatter.format(days, "day");
  }

  return dateFormatter.format(date);
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Günaydın";
  }

  if (hour < 18) {
    return "İyi günler";
  }

  return "İyi akşamlar";
}

function getStatusLabel(status: string) {
  return statusLabels[status] ?? status.replaceAll("_", " ");
}

function getAuditActionLabel(action: string) {
  return (
    auditActionLabels[action] ??
    action
      .replaceAll("_", " ")
      .toLocaleLowerCase("tr-TR")
      .replace(/^./, (character) => character.toLocaleUpperCase("tr-TR"))
  );
}

function getStatusClasses(status: string) {
  switch (status) {
    case "LIVE":
      return "border-emerald-700/20 bg-emerald-600/10 text-emerald-800";

    case "APPROVED":
    case "QUEUED":
      return "border-sky-700/20 bg-sky-600/10 text-sky-800";

    case "PENDING_REVIEW":
      return "border-amber-700/20 bg-amber-500/10 text-amber-800";

    case "REVISION_REQUESTED":
    case "REJECTED":
      return "border-red-700/20 bg-red-600/10 text-red-800";

    default:
      return "border-line bg-surface-strong/60 text-muted";
  }
}

function MetricCard({
  description,
  icon: Icon,
  label,
  value,
}: MetricCardProps) {
  return (
    <article className="panel group p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_70px_rgba(19,19,19,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Icon className="size-5" />
        </div>

        <ArrowRight className="size-4 text-muted/40 transition group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>

      <p className="mt-6 text-sm font-medium text-muted">{label}</p>

      <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-muted">{description}</p>
    </article>
  );
}

function EmptyState({
  description,
  href,
  linkLabel,
  title,
}: {
  description: string;
  href?: string;
  linkLabel?: string;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-surface-strong text-muted">
        <Disc3 className="size-5" />
      </div>

      <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>

      <p className="mt-2 max-w-sm text-xs leading-5 text-muted">
        {description}
      </p>

      {href && linkLabel ? (
        <Link
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:opacity-80"
          href={href}
        >
          <Plus className="size-4" />
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function DashboardOverview({
  artistsCount,
  data,
  labelsCount,
  organizationName,
  userName,
}: DashboardOverviewProps) {
  const firstName = userName.trim().split(/\s+/)[0] || userName;

  const metrics: MetricCardProps[] = [
    {
      description: `${data.stats.liveReleases.toLocaleString(
        "tr-TR",
      )} yayın platformlarda aktif`,
      icon: Disc3,
      label: "Toplam yayın",
      value: compactNumberFormatter.format(data.stats.totalReleases),
    },
    {
      description: `${data.stats.downloads.toLocaleString(
        "tr-TR",
      )} raporlanan indirme`,
      icon: Headphones,
      label: "Toplam dinlenme",
      value: compactNumberFormatter.format(data.stats.streams),
    },
    {
      description: `${labelsCount.toLocaleString(
        "tr-TR",
      )} label altında yönetiliyor`,
      icon: Users,
      label: "Sanatçılar",
      value: artistsCount.toLocaleString("tr-TR"),
    },
    {
      description: "Raporlanan toplam net kazanç",
      icon: WalletCards,
      label: "Tahmini gelir",
      value: formatCurrencyFromMinor(data.stats.netRevenueMinor),
    },
  ];

  const insights = [
    {
      description:
        data.stats.pendingReviewReleases > 0
          ? `${data.stats.pendingReviewReleases.toLocaleString(
              "tr-TR",
            )} yayın şu anda inceleme aşamasında.`
          : "İnceleme bekleyen bir yayın bulunmuyor.",
      icon: BadgeCheck,
      title: "Yayın kontrolü",
    },
    {
      description:
        data.stats.playlistAppearances > 0
          ? `Kataloğun toplam ${data.stats.playlistAppearances.toLocaleString(
              "tr-TR",
            )} playlist görünümü aldı.`
          : "Playlist verileri oluştuğunda performans bilgileri burada gösterilecek.",
      icon: Radio,
      title: "Playlist performansı",
    },
    {
      description:
        data.stats.failedDistributionJobs > 0
          ? `${data.stats.failedDistributionJobs.toLocaleString(
              "tr-TR",
            )} başarısız dağıtım işlemi kontrol bekliyor.`
          : "Tüm dağıtım işlemleri normal çalışıyor.",
      icon:
        data.stats.failedDistributionJobs > 0
          ? AlertTriangle
          : Sparkles,
      title: "Dağıtım sağlığı",
    },
  ];

  const catalogItems = [
    {
      label: "Taslak",
      value: data.stats.draftReleases,
    },
    {
      label: "İncelemede",
      value: data.stats.pendingReviewReleases,
    },
    {
      label: "Düzenleme gerekli",
      value: data.stats.revisionReleases,
    },
    {
      label: "Yayında",
      value: data.stats.liveReleases,
    },
  ];

  const quickActions: QuickAction[] = [
    {
      description: "Yeni bir single, EP veya albüm hazırla.",
      href: "/releases/new",
      icon: Plus,
      title: "Yeni yayın",
    },
    {
      description: "Kataloğunun performans verilerini incele.",
      href: "/analytics",
      icon: BarChart3,
      title: "Analytics",
    },
    {
      description: "Dinlenme ve gelir raporlarını görüntüle.",
      href: "/finance",
      icon: Download,
      title: "Finans raporları",
    },
    {
      description: "Yeni müzikleri keşfet ve topluluğa katıl.",
      href: "/discover",
      icon: Radio,
      title: "Keşfet",
    },
  ];

  return (
    <main className="page-shell">
      <div className="flex w-full min-w-0 flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-foreground text-white shadow-[0_24px_100px_rgba(19,19,19,0.18)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.5),transparent_38%),radial-gradient(circle_at_85%_20%,rgba(239,184,72,0.22),transparent_35%)]" />

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:42px_42px]" />

          <div className="relative grid gap-8 px-6 py-8 md:px-10 md:py-10 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div className="min-w-0 max-w-3xl">
              <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
                <Sparkles className="size-3.5 shrink-0 text-[#efb848]" />
                <span className="truncate">{organizationName}</span>
              </div>

              <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">
                {getGreeting()}, {firstName}.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
                Kataloğunu yönet, yeni yayınlarını hazırla ve müziğinin
                performansını tek bir merkezden takip et.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                href="/discover"
              >
                <Radio className="size-4" />
                Keşfet
              </Link>

              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#efb848] px-5 text-sm font-semibold text-[#17130b] transition hover:bg-[#f5c85f]"
                href="/releases/new"
              >
                <Plus className="size-4" />
                Yeni yayın
              </Link>
            </div>
          </div>

          <div className="relative grid border-t border-white/10 md:grid-cols-3">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4 md:border-b-0 md:border-r md:px-10">
              <CalendarDays className="size-4 shrink-0 text-[#efb848]" />
              <span className="text-sm text-white/60">
                {data.stats.pendingReviewReleases.toLocaleString("tr-TR")} yayın
                incelemede
              </span>
            </div>

            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4 md:border-b-0 md:border-r">
              <Lightbulb className="size-4 shrink-0 text-[#efb848]" />
              <span className="text-sm text-white/60">
                {insights.length} performans içgörüsü hazır
              </span>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <Activity className="size-4 shrink-0 text-[#efb848]" />
              <span className="text-sm text-white/60">
                {data.stats.failedDistributionJobs > 0
                  ? `${data.stats.failedDistributionJobs.toLocaleString(
                      "tr-TR",
                    )} işlem kontrol bekliyor`
                  : "Dağıtım sistemleri çalışıyor"}
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
          <article className="panel min-w-0 overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-5 md:px-6">
              <div className="min-w-0">
                <h2 className="font-semibold text-foreground">Son yayınlar</h2>
                <p className="mt-1 text-sm text-muted">
                  Kataloğunda en son güncellenen çalışmalar
                </p>
              </div>

              <Link
                className="shrink-0 text-sm font-semibold text-accent hover:opacity-80"
                href="/releases"
              >
                Tümünü gör
              </Link>
            </div>

            <div className="divide-y divide-line">
              {data.recentReleases.length > 0 ? (
                data.recentReleases.map((release) => (
                  <Link
                    className="group flex min-w-0 items-center gap-4 px-5 py-4 transition hover:bg-surface-strong/40 md:px-6"
                    href={`/releases/${release.id}`}
                    key={release.id}
                  >
                    <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent/10 text-accent">
                      {release.artworkUploadId ? <Image alt={`${release.title} kapak görseli`} className="object-cover" fill sizes="48px" src={`/api/storage/private/${release.artworkUploadId}`} unoptimized /> : <Music2 className="size-5" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {release.title}
                      </p>

                      <p className="mt-1 truncate text-xs text-muted">
                        {release.artists[0]?.artist.name ??
                          "Sanatçı belirtilmedi"}
                      </p>
                    </div>

                    <div className="hidden shrink-0 text-right sm:block">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                          release.status,
                        )}`}
                      >
                        {getStatusLabel(release.status)}
                      </span>

                      <p className="mt-1.5 text-[11px] text-muted">
                        {formatRelativeDate(release.updatedAt)}
                      </p>
                    </div>

                    <ArrowRight className="size-4 shrink-0 text-muted/40 transition group-hover:translate-x-0.5 group-hover:text-accent" />
                  </Link>
                ))
              ) : (
                <EmptyState
                  description="İlk yayınını oluşturduğunda süreç ve durum bilgileri burada görüntülenecek."
                  href="/releases/new"
                  linkLabel="Yeni yayın oluştur"
                  title="Henüz yayın bulunmuyor"
                />
              )}
            </div>
          </article>

          <article className="overflow-hidden rounded-[2rem] border border-black/10 bg-foreground text-white shadow-[0_12px_60px_rgba(19,19,19,0.12)]">
            <div className="border-b border-white/10 px-5 py-5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-[#efb848]" />
                <h2 className="font-semibold">Radarune Intelligence</h2>
              </div>

              <p className="mt-1 text-sm text-white/45">
                Kataloğuna göre oluşturulan içgörüler
              </p>
            </div>

            <div className="divide-y divide-white/10">
              {insights.map((insight) => {
                const Icon = insight.icon;

                return (
                  <div className="flex gap-4 px-5 py-5" key={insight.title}>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#efb848]/20 bg-[#efb848]/10 text-[#efb848]">
                      <Icon className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{insight.title}</p>

                      <p className="mt-1.5 text-xs leading-5 text-white/45">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <article className="panel min-w-0 p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-foreground">
                  Katalog özeti
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Yayın sürecinin mevcut dağılımı
                </p>
              </div>

              <BarChart3 className="size-5 shrink-0 text-muted" />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {catalogItems.map((item) => (
                <div
                  className="rounded-2xl border border-line bg-surface-strong/50 p-4"
                  key={item.label}
                >
                  <p className="text-xs font-medium text-muted">{item.label}</p>

                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {item.value.toLocaleString("tr-TR")}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel min-w-0 overflow-hidden">
            <div className="border-b border-line px-5 py-5">
              <h2 className="font-semibold text-foreground">
                Son aktiviteler
              </h2>

              <p className="mt-1 text-sm text-muted">
                Organizasyondaki son hareketler
              </p>
            </div>

            <div className="divide-y divide-line">
              {data.recentAuditLogs.length > 0 ? (
                data.recentAuditLogs.slice(0, 5).map((log) => (
                  <div className="flex gap-3 px-5 py-4" key={log.id}>
                    <div className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {getAuditActionLabel(log.action)}
                      </p>

                      <p className="mt-1 truncate text-xs text-muted">
                        {log.actorUser?.name ??
                          log.actorUser?.email ??
                          "Radarune sistemi"}{" "}
                        · {formatRelativeDate(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  description="Organizasyonda yapılan işlemler burada listelenecek."
                  title="Henüz aktivite bulunmuyor"
                />
              )}
            </div>
          </article>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="font-semibold text-foreground">Hızlı işlemler</h2>

            <p className="mt-1 text-sm text-muted">
              Sık kullandığın Radarune araçlarına doğrudan ulaş
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  className="panel group p-5 transition duration-300 hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-[0_18px_70px_rgba(19,19,19,0.12)]"
                  href={action.href}
                  key={action.title}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Icon className="size-5" />
                    </div>

                    <ArrowRight className="size-4 text-muted/40 transition group-hover:translate-x-1 group-hover:text-accent" />
                  </div>

                  <p className="mt-5 text-sm font-semibold text-foreground">
                    {action.title}
                  </p>

                  <p className="mt-1.5 text-xs leading-5 text-muted">
                    {action.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
