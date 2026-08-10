import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarDays,
  Disc3,
  Download,
  Globe2,
  Headphones,
  Lightbulb,
  MapPin,
  Music2,
  Plus,
  Radio,
  Sparkles,
  Share2,
  Users,
  UserPlus,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { releasePublicPath } from "@/features/releases/lib/release-url";

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
    activeSmartLinks: number;
    smartLinkViews: number;
    smartLinkClicks: number;
    audienceCountries: Array<{ country: string | null; _count: { _all: number } }>;
    audienceCities: Array<{ city: string | null; _count: { _all: number } }>;
    audienceSources: Array<{ utmSource: string | null; _count: { _all: number } }>;
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
  artists: Array<{
    id: string;
    name: string;
    slug: string;
    type: string;
    profileImageUrl: string | null;
    coverImageUrl: string | null;
    profilePublishedAt: Date | null;
    _count: { releaseArtistLinks: number; follows: number; smartLinks: number; applications: number };
  }>;
  artistsCount: number;
  canManageArtists: boolean;
  manageableArtistsCount: number;
  data: DashboardData;
  labelsCount: number;
  organizationName: string;
  role: string;
  userName: string;
};

type MetricCardProps = {
  description: string;
  href: string;
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
  SMART_LINK_CREATED: "Smart Link oluşturuldu",
  SMART_LINK_UPDATED: "Smart Link güncellendi",
  SMART_LINK_DELETED: "Smart Link silindi",
  WHATSAPP_INTEGRATION_UPDATED: "WhatsApp entegrasyonu güncellendi",
  INTEGRATION_CREDENTIAL_UPDATED: "Entegrasyon bilgileri güncellendi",
  SOCIAL_AUTH_PROVIDER_UPDATED: "Sosyal giriş ayarları güncellendi",
  ADMIN_SETTING_UPDATED: "Yönetici ayarı güncellendi",
  ARTIST_PROFILE_UPDATED: "Sanatçı profili güncellendi",
  ARTIST_APPLICATION_CREATED: "Sanatçı başvurusu oluşturuldu",
  ARTIST_APPLICATION_APPROVED: "Sanatçı başvurusu onaylandı",
  DISCOVER_CONFIG_UPDATED: "Keşfet ayarları güncellendi",
  PRESAVE_CAMPAIGN_CREATED: "Ön kayıt kampanyası oluşturuldu",
  VOTE_CREATED: "Yayın oyu verildi",
  USER_STATUS_CHANGED: "Kullanıcı durumu değiştirildi",
  USER_ROLE_CHANGED: "Kullanıcı rolü değiştirildi",
  WEBHOOK_ENDPOINT_CREATED: "Webhook uç noktası oluşturuldu",
  WEBHOOK_SECRET_ROTATED: "Webhook anahtarı yenilendi",
  STORAGE_PROVIDER_CREATED: "Depolama sağlayıcısı oluşturuldu",
  STORAGE_PROVIDER_TESTED: "Depolama sağlayıcısı test edildi",
  TENANT_BRANDING_UPDATED: "Marka ayarları güncellendi",
  TENANT_THEME_UPDATED: "Tema ayarları güncellendi",
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
  href,
  icon: Icon,
  label,
  value,
}: MetricCardProps) {
  return (
    <Link
      className="panel group block p-5 transition duration-300 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-[0_18px_70px_rgba(19,19,19,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      href={href}
    >
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
    </Link>
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
  artists,
  artistsCount,
  canManageArtists,
  data,
  manageableArtistsCount,
  labelsCount,
  organizationName,
  role,
  userName,
}: DashboardOverviewProps) {
  const firstName = userName.trim().split(/\s+/)[0] || userName;

  const hasArtistWorkspace = role === "ARTIST" || artistsCount > 0;
  const hasOrganizationWorkspace = ["ORGANIZER", "LABEL", "LABEL_MANAGER"].includes(role) || labelsCount > 0;
  const roleName = hasArtistWorkspace ? "Sanatçı hesabı" : hasOrganizationWorkspace ? "Label / organizatör hesabı" : "Creator hesabı";
  const roleDescription = hasArtistWorkspace
    ? "Kendi sanatçı kanalını, yayınlarını ve performansını yönet."
    : hasOrganizationWorkspace
      ? "Bağlı sanatçıları, şirket kataloğunu ve dağıtımı tek merkezden yönet."
      : "Profilini tamamla, sanatçı veya organizatör olarak yayın araçlarını aç.";

  const metrics: MetricCardProps[] = [
    {
      description: `${data.stats.liveReleases.toLocaleString(
        "tr-TR",
      )} yayın platformlarda aktif`,
      icon: Disc3,
      label: "Toplam yayın",
      value: compactNumberFormatter.format(data.stats.totalReleases),
      href: "/releases",
    },
    {
      description: `${data.stats.downloads.toLocaleString(
        "tr-TR",
      )} raporlanan indirme`,
      icon: Headphones,
      label: "Toplam dinlenme",
      value: compactNumberFormatter.format(data.stats.streams),
      href: "/analytics",
    },
    {
      description: `${labelsCount.toLocaleString(
        "tr-TR",
      )} label altında yönetiliyor`,
      icon: Users,
      label: "Sanatçılar",
      value: artistsCount.toLocaleString("tr-TR"),
      href: canManageArtists ? "/artists" : "/artist-profile",
    },
    {
      description: "Raporlanan toplam net kazanç",
      icon: WalletCards,
      label: "Tahmini gelir",
      value: formatCurrencyFromMinor(data.stats.netRevenueMinor),
      href: "/finance",
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
      href:
        manageableArtistsCount > 0
          ? "/releases/new"
          : "/become?reason=release-required",
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

  const isOrganizationRole = hasOrganizationWorkspace;
  const isAdminRole = ["ADMIN", "SUPER_ADMIN"].includes(role);
  const workspaceActions = hasArtistWorkspace
    ? [
        { description: "Kanal görünümünü, kapak ve sosyal bağlantılarını düzenle.", href: "/artist-profile/edit", icon: Music2, title: "Sanatçı profilim" },
        { description: "Yeni yayınını ve katalog akışını hazırla.", href: "/releases/new", icon: Disc3, title: "Yayın hazırla" },
        { description: "Spotify, Apple Music ve sosyal linklerini tek sayfada topla.", href: "/smart-links/new", icon: Share2, title: "Smart Link oluştur" },
        { description: "Dinlenme, ülke, şehir ve gelir performansını incele.", href: "/analytics", icon: BarChart3, title: "Sanatçı analizleri" },
      ]
    : isOrganizationRole
      ? [
          { description: "Bağlı sanatçı kanallarını ve doğrulama durumlarını yönet.", href: "/artists", icon: Users, title: "Sanatçıları yönet" },
          { description: "Şirket/label katalog yapısını düzenle.", href: "/labels", icon: Building2, title: "Label ve organizasyon" },
          { description: "Sanatçı kataloğu için yeni dağıtım hazırlığı başlat.", href: "/releases/new", icon: Disc3, title: "Dağıtım hazırlığı" },
          { description: "Ekip için paylaşılabilir, SEO uyumlu linkler oluştur.", href: "/smart-links/new", icon: Share2, title: "Smart Link oluştur" },
        ]
      : [
          { description: "Kendi kanalın ve yayın araçların için başvuru yap.", href: "/become?type=artist", icon: Music2, title: "Sanatçı ol" },
          { description: "Label, menajerlik veya organizasyon hesabı için başvur.", href: "/become?type=organization", icon: Building2, title: "Organizasyon başvurusu" },
          { description: "Ücretsiz Smart Link ve yayın araçlarını açmak için creator erişimi iste.", href: "/become", icon: Share2, title: "Creator araçlarını aç" },
          { description: "Radarune topluluğuna yeni üyeler davet et.", href: "/settings", icon: UserPlus, title: "Üyeleri davet et" },
        ];

  if (isAdminRole) {
    workspaceActions.push({
      description: "Admin yetkinle ekip üyelerini ve erişimlerini oluştur.",
      href: "/admin/users/new",
      icon: UserPlus,
      title: "Üye oluştur",
    });
  }

  return (
    <main className="dashboard-page page-shell">
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

              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#efb848]">
                {roleName}
              </p>

              <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">
                {getGreeting()}, {firstName}.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
                {roleDescription}
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
                href={
                  manageableArtistsCount > 0
                    ? "/releases/new"
                    : "/become?reason=release-required"
                }
              >
                <Plus className="size-4" />
                Yeni yayın
              </Link>

              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                href="/dashboard/support"
              >
                Destek merkezi
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

        <section className="rounded-[2rem] border border-emerald-900/15 bg-[#10201d] p-5 text-white shadow-[0_20px_70px_rgba(8,35,28,0.14)] md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300">Çalışma alanı</p>
              <h2 className="mt-2 text-xl font-semibold">{role === "ARTIST" ? "Sanatçı araçları" : isOrganizationRole ? "Label ve organizasyon araçları" : "Radarune Creator"}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-white/50">{role === "ARTIST" ? "Kanalını, yayınlarını, Smart Link’lerini ve analizlerini tek alandan yönet." : isOrganizationRole ? "Sanatçı, ekip, katalog ve dağıtım operasyonunu tek çalışma alanında topla." : "Sanatçı veya organizasyon başvurunu tamamla; yayın, Smart Link ve ekip araçlarını aç."}</p>
            </div>
            <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">{role === "USER" ? "Başvuru gerekli" : "Aktif çalışma alanı"}</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {workspaceActions.map(({ description, href, icon: Icon, title }) => (
              <Link className="group rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition hover:-translate-y-0.5 hover:border-emerald-300/30 hover:bg-white/[0.08]" href={href} key={title}>
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-300"><Icon className="size-5" /></span>
                <h3 className="mt-4 text-sm font-semibold text-white">{title}<ArrowRight className="ml-1 inline size-3.5 text-emerald-300 transition group-hover:translate-x-0.5" /></h3>
                <p className="mt-2 text-xs leading-5 text-white/45">{description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        <section className="rounded-[2rem] border border-black/[0.07] bg-[#10201d] p-5 text-white shadow-[0_20px_70px_rgba(8,35,28,0.14)] md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300">Artist roster</p>
              <h2 className="mt-2 text-xl font-semibold">Sanatçı kanalların</h2>
              <p className="mt-1 text-sm text-white/50">Profil, yayın, oy ve bağlantı yönetimine buradan geç.</p>
            </div>
            <Link className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white" href={canManageArtists ? "/artists" : "/artist-profile"}>
              {canManageArtists ? "Tüm sanatçıları yönet" : "Profil ayarlarına git"} <ArrowRight className="ml-1 inline size-3.5" />
            </Link>
          </div>
          {artists.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {artists.slice(0, 6).map((artist) => (
                <article className="group rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.09]" key={artist.id}>
                  <div className="flex items-center gap-3">
                    <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-300/15 text-lg font-bold text-emerald-200">
                      {artist.profileImageUrl ? <Image alt="" className="object-cover" fill sizes="48px" src={artist.profileImageUrl} unoptimized /> : artist.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate font-semibold">{artist.name}</h3><span className="shrink-0 rounded-full bg-emerald-300/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200">{artist._count.applications > 0 ? "Doğrulanmış sanatçı" : "Sanatçı profili"}</span></div><p className="mt-1 truncate text-xs text-white/45">radarune.com/artist/{artist.slug}</p></div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-black/15 p-2"><p className="text-sm font-semibold">{artist._count.releaseArtistLinks}</p><p className="mt-1 text-[10px] text-white/40">Yayın</p></div><div className="rounded-xl bg-black/15 p-2"><p className="text-sm font-semibold">{artist._count.follows}</p><p className="mt-1 text-[10px] text-white/40">Takipçi</p></div><div className="rounded-xl bg-black/15 p-2"><p className="text-sm font-semibold">{artist._count.smartLinks}</p><p className="mt-1 text-[10px] text-white/40">Link</p></div></div>
                  <div className="mt-4 flex gap-2"><Link className="flex-1 rounded-xl bg-emerald-300 px-3 py-2 text-center text-xs font-bold text-[#08201a]" href={`/artist/${artist.slug}`}>Profili aç</Link><Link className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white" href={`/dashboard/artists/${artist.id}/profile`}>Düzenle</Link></div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/15 px-5 py-8 text-sm text-white/50">Henüz bağlı bir sanatçı profili yok. Yayın göndermek için önce sanatçı profilini oluştur.</div>
          )}
        </section>

        <section className="relative overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-[linear-gradient(115deg,#eafff6_0%,#f4f9ff_55%,#fff8e8_100%)] p-5 shadow-[0_18px_70px_rgba(22,101,76,0.08)] md:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700">Growth snapshot</p><h2 className="mt-2 text-xl font-semibold text-[#10201b]">Müziğinin Radarune’daki hareketi</h2><p className="mt-1 text-sm text-[#63736d]">Smart Link ve keşif performansını tek bakışta takip et.</p></div><Link className="rounded-xl bg-[#10201b] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1d3930]" href="/smart-links">Growth araçlarını aç →</Link></div>
          <div className="relative mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/80 bg-white/70 p-4"><p className="text-xs text-[#63736d]">Aktif Smart Link</p><p className="mt-2 text-2xl font-semibold text-[#10201b]">{data.stats.activeSmartLinks}</p></div><div className="rounded-2xl border border-white/80 bg-white/70 p-4"><p className="text-xs text-[#63736d]">Smart Link görüntülenmesi</p><p className="mt-2 text-2xl font-semibold text-[#10201b]">{data.stats.smartLinkViews.toLocaleString("tr-TR")}</p></div><div className="rounded-2xl border border-white/80 bg-white/70 p-4"><p className="text-xs text-[#63736d]">Platform tıklaması</p><p className="mt-2 text-2xl font-semibold text-[#10201b]">{data.stats.smartLinkClicks.toLocaleString("tr-TR")}</p></div></div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_1.1fr_0.8fr]">
          <article className="panel p-5 md:p-6">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Audience signal</p><h2 className="mt-2 text-lg font-semibold text-foreground">Ülke bazlı erişim</h2></div><Globe2 className="size-5 text-accent" /></div>
            <div className="mt-5 space-y-3">{data.stats.audienceCountries.length > 0 ? data.stats.audienceCountries.map((row) => <div className="flex items-center justify-between rounded-xl border border-line bg-surface-strong/50 px-3 py-2.5" key={row.country}><span className="text-sm font-medium">{row.country}</span><span className="text-xs text-muted">{row._count._all.toLocaleString("tr-TR")} ziyaret</span></div>) : <p className="text-sm text-muted">Smart Link ziyaretleri ülke bilgisi oluşturduğunda burada görünür.</p>}</div>
          </article>
          <article className="panel p-5 md:p-6">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Audience signal</p><h2 className="mt-2 text-lg font-semibold text-foreground">Şehir bazlı erişim</h2></div><MapPin className="size-5 text-accent" /></div>
            <div className="mt-5 space-y-3">{data.stats.audienceCities.length > 0 ? data.stats.audienceCities.map((row) => <div className="flex items-center justify-between rounded-xl border border-line bg-surface-strong/50 px-3 py-2.5" key={row.city}><span className="text-sm font-medium">{row.city}</span><span className="text-xs text-muted">{row._count._all.toLocaleString("tr-TR")} ziyaret</span></div>) : <p className="text-sm text-muted">Şehir kırılımı Smart Link trafik verisi geldikçe oluşur.</p>}</div>
          </article>
          <article className="overflow-hidden rounded-[2rem] bg-[#10201d] p-5 text-white shadow-[0_18px_60px_rgba(8,35,28,0.12)] md:p-6">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">Campaign params</p><h2 className="mt-2 text-lg font-semibold">Sosyal kaynaklar</h2></div><Share2 className="size-5 text-emerald-300" /></div>
            <p className="mt-2 text-sm leading-6 text-white/50">TikTok, Instagram ve diğer UTM kaynaklarının Smart Link etkisini izle.</p>
            <div className="mt-5 space-y-3">{data.stats.audienceSources.length > 0 ? data.stats.audienceSources.map((row) => <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5" key={row.utmSource}><span className="text-sm font-medium">{row.utmSource}</span><span className="text-xs text-white/50">{row._count._all.toLocaleString("tr-TR")}</span></div>) : <p className="text-sm text-white/45">Henüz UTM kaynağı yok.</p>}</div>
          </article>
        </section>

        {manageableArtistsCount === 0 ? (
          <section className="panel flex flex-col gap-5 border-accent/20 bg-accent/5 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Yayın oluşturma erişimi
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">
                Önce sanatçı profilini doğrula
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Yeni yayın göndermek için sanatçı başvurusu yapın. Başvurunuz
                onaylandığında yayın sihirbazı yalnızca size bağlı sanatçı
                profilleriyle açılır.
              </p>
            </div>
            <Link
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
              href="/become?reason=release-required"
            >
              Sanatçı başvurusu yap
            </Link>
          </section>
        ) : canManageArtists ? (
          <section className="panel flex flex-col gap-5 border-accent/20 bg-accent/5 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Label çalışma alanı
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">
                Tüm sanatçı profillerini tek yerden yönetin
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Sanatçı profillerine, bağlantılarına ve ekip erişimlerine
                doğrudan ulaşın.
              </p>
            </div>
            <Link
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-surface px-5 py-3 text-sm font-semibold text-accent transition hover:bg-accent/10"
              href="/artists"
            >
              Sanatçıları yönet
            </Link>
          </section>
        ) : null}

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
                    href={releasePublicPath(release.title, release.id)}
                    key={release.id}
                  >
                    <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent/10 text-accent">
                      {release.artworkUploadId ? <Image alt={`${release.title} kapak görseli`} className="object-cover" fill sizes="48px" src={["APPROVED", "DISTRIBUTED", "LIVE"].includes(release.status) ? `/api/public/v1/releases/${release.id}/artwork` : `/api/storage/private/${release.artworkUploadId}`} unoptimized /> : <Music2 className="size-5" />}
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
