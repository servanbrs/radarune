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
import { publicReleaseArtworkUrl } from "@/features/releases/lib/public-artwork-url";
import { normalizeLocale, t } from "@/lib/i18n";
import { ArtistChannelDirectory } from "@/features/dashboard/components/artist-channel-directory";

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
  channelReleases: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: string;
    artworkUploadId: string | null;
    trackCount: number;
    artistIds: string[];
  }>;
  artistsCount: number;
  canManageArtists: boolean;
  manageableArtistsCount: number;
  showManagementActivity: boolean;
  showCatalogAnalytics: boolean;
  data: DashboardData;
  labelsCount: number;
  organizationName: string;
  role: string;
  userName: string;
  locale: string;
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

function formatCurrencyFromMinor(value: bigint, locale = "tr-TR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number(value) / 100);
}

function formatRelativeDate(date: Date, locale = "tr-TR") {
  const relativeDateFormatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const dateFormatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });
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

function getGreeting(locale = "tr-TR") {
  const hour = new Date().getHours();

  if (hour < 12) {
    return t(locale, "greetingMorning");
  }

  if (hour < 18) {
    return t(locale, "greetingDay");
  }

  return t(locale, "greetingEvening");
}

function getStatusLabel(status: string, locale = "tr-TR") {
  const labels = statusLabels[status];

  if (locale === "en-US") {
    return {
      DRAFT: "Draft",
      PENDING_REVIEW: "Under review",
      REVISION_REQUESTED: "Revision needed",
      APPROVED: "Approved",
      QUEUED: "Distribution queued",
      LIVE: "Live",
      REJECTED: "Rejected",
    }[status] ?? labels ?? status.replaceAll("_", " ");
  }

  if (locale === "de-DE") {
    return {
      DRAFT: "Entwurf",
      PENDING_REVIEW: "In Prüfung",
      REVISION_REQUESTED: "Überarbeitung nötig",
      APPROVED: "Freigegeben",
      QUEUED: "Distribution läuft",
      LIVE: "Live",
      REJECTED: "Abgelehnt",
    }[status] ?? labels ?? status.replaceAll("_", " ");
  }

  return labels ?? status.replaceAll("_", " ");
}

function getAuditActionLabel(action: string, locale = "tr-TR") {
  const translations: Record<string, Record<string, string>> = {
    "en-US": {
      RELEASE_CREATED: "New release created", RELEASE_UPDATED: "Release updated", RELEASE_SUBMITTED: "Release submitted for review", RELEASE_APPROVED: "Release approved", RELEASE_REJECTED: "Release rejected",
      USER_CREATED: "New user created", USER_UPDATED: "User details updated", ARTIST_CREATED: "New artist created", ARTIST_UPDATED: "Artist details updated", DISTRIBUTION_CREATED: "Distribution job created", DISTRIBUTION_FAILED: "Distribution job failed",
      SMART_LINK_CREATED: "Smart Link created", SMART_LINK_UPDATED: "Smart Link updated", SMART_LINK_DELETED: "Smart Link deleted", WHATSAPP_INTEGRATION_UPDATED: "WhatsApp integration updated", INTEGRATION_CREDENTIAL_UPDATED: "Integration credentials updated", SOCIAL_AUTH_PROVIDER_UPDATED: "Social sign-in settings updated", ADMIN_SETTING_UPDATED: "Admin setting updated", ARTIST_PROFILE_UPDATED: "Artist profile updated", ARTIST_APPLICATION_CREATED: "Artist application created", ARTIST_APPLICATION_APPROVED: "Artist application approved", DISCOVER_CONFIG_UPDATED: "Discover settings updated", PRESAVE_CAMPAIGN_CREATED: "Pre-save campaign created", VOTE_CREATED: "Release vote submitted", USER_STATUS_CHANGED: "User status changed", USER_ROLE_CHANGED: "User role changed", WEBHOOK_ENDPOINT_CREATED: "Webhook endpoint created", WEBHOOK_SECRET_ROTATED: "Webhook secret rotated", STORAGE_PROVIDER_CREATED: "Storage provider created", STORAGE_PROVIDER_TESTED: "Storage provider tested", TENANT_BRANDING_UPDATED: "Brand settings updated", TENANT_THEME_UPDATED: "Theme settings updated",
    },
    "de-DE": {
      RELEASE_CREATED: "Neuer Release erstellt", RELEASE_UPDATED: "Release aktualisiert", RELEASE_SUBMITTED: "Release zur Prüfung eingereicht", RELEASE_APPROVED: "Release freigegeben", RELEASE_REJECTED: "Release abgelehnt",
      USER_CREATED: "Neuer Benutzer erstellt", USER_UPDATED: "Benutzerdaten aktualisiert", ARTIST_CREATED: "Neuer Künstler erstellt", ARTIST_UPDATED: "Künstlerdaten aktualisiert", DISTRIBUTION_CREATED: "Distributionsauftrag erstellt", DISTRIBUTION_FAILED: "Distributionsauftrag fehlgeschlagen",
      SMART_LINK_CREATED: "Smart Link erstellt", SMART_LINK_UPDATED: "Smart Link aktualisiert", SMART_LINK_DELETED: "Smart Link gelöscht", WHATSAPP_INTEGRATION_UPDATED: "WhatsApp-Integration aktualisiert", INTEGRATION_CREDENTIAL_UPDATED: "Integrationsdaten aktualisiert", SOCIAL_AUTH_PROVIDER_UPDATED: "Social-Login-Einstellungen aktualisiert", ADMIN_SETTING_UPDATED: "Admin-Einstellung aktualisiert", ARTIST_PROFILE_UPDATED: "Künstlerprofil aktualisiert", ARTIST_APPLICATION_CREATED: "Künstlerbewerbung erstellt", ARTIST_APPLICATION_APPROVED: "Künstlerbewerbung freigegeben", DISCOVER_CONFIG_UPDATED: "Discover-Einstellungen aktualisiert", PRESAVE_CAMPAIGN_CREATED: "Pre-Save-Kampagne erstellt", VOTE_CREATED: "Für Release abgestimmt", USER_STATUS_CHANGED: "Benutzerstatus geändert", USER_ROLE_CHANGED: "Benutzerrolle geändert", WEBHOOK_ENDPOINT_CREATED: "Webhook-Endpunkt erstellt", WEBHOOK_SECRET_ROTATED: "Webhook-Schlüssel erneuert", STORAGE_PROVIDER_CREATED: "Speicheranbieter erstellt", STORAGE_PROVIDER_TESTED: "Speicheranbieter getestet", TENANT_BRANDING_UPDATED: "Markeneinstellungen aktualisiert", TENANT_THEME_UPDATED: "Designeinstellungen aktualisiert",
    },
  };

  return translations[locale]?.[action] ?? auditActionLabels[action] ?? action
    .replaceAll("_", " ")
    .toLocaleLowerCase(locale === "de-DE" ? "de-DE" : "tr-TR")
    .replace(/^./, (character) => character.toLocaleUpperCase(locale === "de-DE" ? "de-DE" : "tr-TR"));
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
  channelReleases,
  artistsCount,
  canManageArtists,
  data,
  manageableArtistsCount,
  showManagementActivity,
  showCatalogAnalytics,
  labelsCount,
  organizationName,
  role,
  userName,
  locale,
}: DashboardOverviewProps) {
  const activeLocale = normalizeLocale(locale);
  const compactNumberFormatter = new Intl.NumberFormat(activeLocale, { notation: "compact", maximumFractionDigits: 1 });
  const formatNumber = (value: number) => value.toLocaleString(activeLocale);
  const firstName = userName.trim().split(/\s+/)[0] || userName;

  // A system role alone is not enough to expose creator analytics. The
  // account must actually have an artist channel linked to it.
  const hasArtistWorkspace = artistsCount > 0;
  const hasOrganizationWorkspace = ["ORGANIZER", "LABEL", "LABEL_MANAGER"].includes(role) || labelsCount > 0;
  const roleName = hasArtistWorkspace ? t(activeLocale, "artistAccount") : hasOrganizationWorkspace ? t(activeLocale, "labelAccount") : t(activeLocale, "creatorAccount");
  const roleDescription = hasArtistWorkspace
    ? t(activeLocale, "artistAccountDescription")
    : hasOrganizationWorkspace
      ? t(activeLocale, "labelAccountDescription")
      : t(activeLocale, "creatorAccountDescription");

  const metrics: MetricCardProps[] = [
    {
      description: `${formatNumber(data.stats.liveReleases)} ${t(activeLocale, "release")} ${activeLocale === "tr-TR" ? "platformlarda aktif" : activeLocale === "de-DE" ? "auf Plattformen aktiv" : "active on platforms"}`,
      icon: Disc3,
      label: activeLocale === "tr-TR" ? "Toplam yayın" : activeLocale === "de-DE" ? "Releases gesamt" : "Total releases",
      value: compactNumberFormatter.format(data.stats.totalReleases),
      href: "/releases",
    },
    {
      description: `${formatNumber(data.stats.downloads)} ${activeLocale === "tr-TR" ? "raporlanan indirme" : activeLocale === "de-DE" ? "gemeldete Downloads" : "reported downloads"}`,
      icon: Headphones,
      label: activeLocale === "tr-TR" ? "Toplam dinlenme" : activeLocale === "de-DE" ? "Streams gesamt" : "Total streams",
      value: compactNumberFormatter.format(data.stats.streams),
      href: "/analytics",
    },
    {
      description: `${formatNumber(labelsCount)} ${activeLocale === "tr-TR" ? "label altında yönetiliyor" : activeLocale === "de-DE" ? "unter Labels verwaltet" : "managed under labels"}`,
      icon: Users,
      label: activeLocale === "tr-TR" ? "Sanatçılar" : activeLocale === "de-DE" ? "Künstler" : "Artists",
      value: formatNumber(artistsCount),
      href: canManageArtists ? "/artists" : "/artist-profile",
    },
    {
      description: activeLocale === "tr-TR" ? "Raporlanan toplam net kazanç" : activeLocale === "de-DE" ? "Gemeldeter Nettoumsatz" : "Reported net revenue",
      icon: WalletCards,
      label: activeLocale === "tr-TR" ? "Tahmini gelir" : activeLocale === "de-DE" ? "Geschätzte Einnahmen" : "Estimated revenue",
      value: formatCurrencyFromMinor(data.stats.netRevenueMinor, activeLocale),
      href: "/finance",
    },
  ];

  const insights = [
    {
      description:
        data.stats.pendingReviewReleases > 0
          ? `${formatNumber(data.stats.pendingReviewReleases)} ${activeLocale === "tr-TR" ? "yayın" : activeLocale === "de-DE" ? "Release(s)" : "release(s)"} ${t(activeLocale, "reviewPending")}`
          : t(activeLocale, "noReviewPending"),
      icon: BadgeCheck,
      title: activeLocale === "tr-TR" ? "Yayın kontrolü" : activeLocale === "de-DE" ? "Release-Prüfung" : "Release review",
    },
    {
      description:
        data.stats.playlistAppearances > 0
          ? `${activeLocale === "tr-TR" ? "Kataloğun toplam" : activeLocale === "de-DE" ? "Dein Katalog hat insgesamt" : "Your catalog received"} ${formatNumber(data.stats.playlistAppearances)} ${activeLocale === "tr-TR" ? "playlist görünümü aldı." : activeLocale === "de-DE" ? "Playlist-Aufrufe." : "playlist views."}`
          : activeLocale === "tr-TR" ? "Playlist verileri oluştuğunda performans bilgileri burada gösterilecek." : activeLocale === "de-DE" ? "Playlist-Daten werden hier angezeigt, sobald sie verfügbar sind." : "Playlist performance will appear here when data is available.",
      icon: Radio,
      title: activeLocale === "tr-TR" ? "Playlist performansı" : activeLocale === "de-DE" ? "Playlist-Performance" : "Playlist performance",
    },
    {
      description:
        data.stats.failedDistributionJobs > 0
          ? `${formatNumber(data.stats.failedDistributionJobs)} ${activeLocale === "tr-TR" ? "başarısız dağıtım işlemi" : activeLocale === "de-DE" ? "fehlgeschlagene Distribution(s)" : "failed distribution job(s)"} ${t(activeLocale, "distributionNeedsReview")}.`
          : t(activeLocale, "distributionHealthy"),
      icon:
        data.stats.failedDistributionJobs > 0
          ? AlertTriangle
          : Sparkles,
      title: activeLocale === "tr-TR" ? "Dağıtım sağlığı" : activeLocale === "de-DE" ? "Distributionsstatus" : "Distribution health",
    },
  ];

  const catalogItems = [
    {
      label: getStatusLabel("DRAFT", activeLocale),
      value: data.stats.draftReleases,
    },
    {
      label: getStatusLabel("PENDING_REVIEW", activeLocale),
      value: data.stats.pendingReviewReleases,
    },
    {
      label: getStatusLabel("REVISION_REQUESTED", activeLocale),
      value: data.stats.revisionReleases,
    },
    {
      label: getStatusLabel("LIVE", activeLocale),
      value: data.stats.liveReleases,
    },
  ];

  const quickActions: QuickAction[] = [
    {
      description: t(activeLocale, "newReleaseDescription"),
      href:
        manageableArtistsCount > 0
          ? "/releases/new"
          : "/become?reason=release-required",
      icon: Plus,
      title: t(activeLocale, "newRelease"),
    },
    {
      description: t(activeLocale, "analyticsDescription"),
      href: "/analytics",
      icon: BarChart3,
      title: t(activeLocale, "analytics"),
    },
    {
      description: t(activeLocale, "financeReportsDescription"),
      href: "/finance",
      icon: Download,
      title: t(activeLocale, "financeReports"),
    },
    {
      description: t(activeLocale, "discoverDescription"),
      href: "/discover",
      icon: Radio,
      title: t(activeLocale, "discover"),
    },
  ];

  const isOrganizationRole = hasOrganizationWorkspace;
  const isAdminRole = ["ADMIN", "SUPER_ADMIN"].includes(role);
  const workspaceActions = hasArtistWorkspace
    ? [
        { description: t(activeLocale, "artistProfileWorkspaceDescription"), href: "/artist-profile/edit", icon: Music2, title: t(activeLocale, "artistProfileWorkspace") },
        { description: t(activeLocale, "prepareReleaseDescription"), href: "/releases/new", icon: Disc3, title: t(activeLocale, "prepareRelease") },
        { description: t(activeLocale, "createSmartLinkDescription"), href: "/smart-links/new", icon: Share2, title: t(activeLocale, "createSmartLink") },
        { description: t(activeLocale, "artistAnalyticsDescription"), href: "/analytics", icon: BarChart3, title: t(activeLocale, "artistAnalytics") },
      ]
    : isOrganizationRole
      ? [
          { description: t(activeLocale, "manageArtistChannelsDescription"), href: "/artists", icon: Users, title: t(activeLocale, "manageArtistChannels") },
          { description: t(activeLocale, "labelOrganizationDescription"), href: "/labels", icon: Building2, title: t(activeLocale, "labelOrganization") },
          { description: t(activeLocale, "prepareDistributionDescription"), href: "/releases/new", icon: Disc3, title: t(activeLocale, "prepareDistribution") },
          { description: t(activeLocale, "createSmartLinkDescription"), href: "/smart-links/new", icon: Share2, title: t(activeLocale, "createSmartLink") },
        ]
      : [
          { description: t(activeLocale, "artistApplicationDescription"), href: "/become?type=artist", icon: Music2, title: t(activeLocale, "artistApplication") },
          { description: t(activeLocale, "organizationApplicationDescription"), href: "/become?type=organization", icon: Building2, title: t(activeLocale, "organizationApplication") },
          { description: t(activeLocale, "enableCreatorToolsDescription"), href: "/become", icon: Share2, title: t(activeLocale, "enableCreatorTools") },
          { description: t(activeLocale, "inviteMembersDescription"), href: "/settings", icon: UserPlus, title: t(activeLocale, "inviteMembers") },
        ];

  if (isAdminRole) {
    workspaceActions.push({
      description: t(activeLocale, "createMemberDescription"),
      href: "/admin/users/new",
      icon: UserPlus,
      title: t(activeLocale, "createMember"),
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
                {getGreeting(activeLocale)}, {firstName}.
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
                {t(activeLocale, "discover")}
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
                {t(activeLocale, "newRelease")}
              </Link>

              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                href="/dashboard/support"
              >
                {t(activeLocale, "supportCenter")}
              </Link>
            </div>
          </div>

          <div className="relative grid border-t border-white/10 md:grid-cols-3">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4 md:border-b-0 md:border-r md:px-10">
              <CalendarDays className="size-4 shrink-0 text-[#efb848]" />
              <span className="text-sm text-white/60">
                {data.stats.pendingReviewReleases.toLocaleString(activeLocale)} {activeLocale === "tr-TR" ? "yayın incelemede" : activeLocale === "de-DE" ? "Release(s) in Prüfung" : "release(s) under review"}
              </span>
            </div>

            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4 md:border-b-0 md:border-r">
              <Lightbulb className="size-4 shrink-0 text-[#efb848]" />
              <span className="text-sm text-white/60">
                {insights.length} {activeLocale === "tr-TR" ? "performans içgörüsü hazır" : activeLocale === "de-DE" ? "Performance-Einblicke bereit" : "performance insights ready"}
              </span>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <Activity className="size-4 shrink-0 text-[#efb848]" />
              <span className="text-sm text-white/60">
                {data.stats.failedDistributionJobs > 0
                  ? `${data.stats.failedDistributionJobs.toLocaleString(activeLocale)} ${activeLocale === "tr-TR" ? "işlem kontrol bekliyor" : activeLocale === "de-DE" ? "Vorgang/Vorgänge benötigen Prüfung" : "job(s) need review"}`
                  : t(activeLocale, "distributionHealthy")}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-900/15 bg-[#10201d] p-5 text-white shadow-[0_20px_70px_rgba(8,35,28,0.14)] md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300">{t(activeLocale, "workingArea")}</p>
              <h2 className="mt-2 text-xl font-semibold">{role === "ARTIST" ? t(activeLocale, "artistTools") : isOrganizationRole ? t(activeLocale, "labelTools") : t(activeLocale, "creatorTools")}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-white/50">{role === "ARTIST" ? (activeLocale === "tr-TR" ? "Kanalını, yayınlarını, Smart Link’lerini ve analizlerini tek alandan yönet." : activeLocale === "de-DE" ? "Verwalte Kanal, Releases, Smart Links und Analysen an einem Ort." : "Manage your channel, releases, Smart Links and analytics in one place.") : isOrganizationRole ? (activeLocale === "tr-TR" ? "Sanatçı, ekip, katalog ve dağıtım operasyonunu tek çalışma alanında topla." : activeLocale === "de-DE" ? "Verwalte Künstler, Team, Katalog und Distribution zentral." : "Bring artists, team, catalog and distribution operations into one workspace.") : (activeLocale === "tr-TR" ? "Sanatçı veya organizasyon başvurunu tamamla; yayın, Smart Link ve ekip araçlarını aç." : activeLocale === "de-DE" ? "Schließe deine Künstler- oder Organisationsbewerbung ab und schalte Release-, Smart-Link- und Team-Werkzeuge frei." : "Complete your artist or organization application to unlock release, Smart Link and team tools.")}</p>
            </div>
            <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">{role === "USER" ? t(activeLocale, "applicationRequired") : t(activeLocale, "activeWorkspace")}</span>
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

        {showCatalogAnalytics ? <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        <section className="rounded-[2rem] border border-black/[0.07] bg-[#10201d] p-5 text-white shadow-[0_20px_70px_rgba(8,35,28,0.14)] md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300">{activeLocale === "tr-TR" ? "Sanatçı listesi" : activeLocale === "de-DE" ? "Künstlerliste" : "Artist roster"}</p>
              <h2 className="mt-2 text-xl font-semibold">{t(activeLocale, "artistChannels")}</h2>
              <p className="mt-1 text-sm text-white/50">{t(activeLocale, "artistChannelsDescription")}</p>
            </div>
            <Link className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white" href={canManageArtists ? "/artists" : "/artist-profile"}>
              {canManageArtists ? t(activeLocale, "manageArtists") : t(activeLocale, "goToProfileSettings")} <ArrowRight className="ml-1 inline size-3.5" />
            </Link>
          </div>
          <ArtistChannelDirectory
            artists={artists.map((artist) => ({
              id: artist.id,
              name: artist.name,
              slug: artist.slug,
              profileImageUrl: artist.profileImageUrl,
              releaseCount: artist._count.releaseArtistLinks,
              followerCount: artist._count.follows,
              smartLinkCount: artist._count.smartLinks,
              verified: artist._count.applications > 0,
            }))}
            labels={{
              artistProfile: t(activeLocale, "artistProfile"),
              edit: t(activeLocale, "edit"),
              followers: t(activeLocale, "followers"),
              link: t(activeLocale, "link"),
              noArtistProfile: t(activeLocale, "noArtistProfile"),
              noRelease: activeLocale === "tr-TR" ? "Henüz yayın yok." : activeLocale === "de-DE" ? "Noch kein Release." : "No releases yet.",
              openProfile: t(activeLocale, "openProfile"),
              release: t(activeLocale, "release"),
              searchPlaceholder: activeLocale === "tr-TR" ? "Sanatçı ara…" : activeLocale === "de-DE" ? "Künstler suchen…" : "Search artist…",
              verifiedArtist: t(activeLocale, "verifiedArtist"),
            }}
            releases={channelReleases}
          />
        </section>

        <section className="relative overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-[linear-gradient(115deg,#eafff6_0%,#f4f9ff_55%,#fff8e8_100%)] p-5 shadow-[0_18px_70px_rgba(22,101,76,0.08)] md:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700">{t(activeLocale, "growthSnapshot")}</p><h2 className="mt-2 text-xl font-semibold text-[#10201b]">{t(activeLocale, "musicMovement")}</h2><p className="mt-1 text-sm text-[#63736d]">{t(activeLocale, "growthDescription")}</p></div><Link className="rounded-xl bg-[#10201b] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1d3930]" href="/smart-links">{t(activeLocale, "openGrowthTools")}</Link></div>
          <div className="relative mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/80 bg-white/70 p-4"><p className="text-xs text-[#63736d]">{t(activeLocale, "activeSmartLink")}</p><p className="mt-2 text-2xl font-semibold text-[#10201b]">{formatNumber(data.stats.activeSmartLinks)}</p></div><div className="rounded-2xl border border-white/80 bg-white/70 p-4"><p className="text-xs text-[#63736d]">{t(activeLocale, "smartLinkViews")}</p><p className="mt-2 text-2xl font-semibold text-[#10201b]">{formatNumber(data.stats.smartLinkViews)}</p></div><div className="rounded-2xl border border-white/80 bg-white/70 p-4"><p className="text-xs text-[#63736d]">{t(activeLocale, "platformClicks")}</p><p className="mt-2 text-2xl font-semibold text-[#10201b]">{formatNumber(data.stats.smartLinkClicks)}</p></div></div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_1.1fr_0.8fr]">
          <article className="panel p-5 md:p-6">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">{t(activeLocale, "audienceSignal")}</p><h2 className="mt-2 text-lg font-semibold text-foreground">{t(activeLocale, "countryReach")}</h2></div><Globe2 className="size-5 text-accent" /></div>
            <div className="mt-5 space-y-3">{data.stats.audienceCountries.length > 0 ? data.stats.audienceCountries.map((row) => <div className="flex items-center justify-between rounded-xl border border-line bg-surface-strong/50 px-3 py-2.5" key={row.country}><span className="text-sm font-medium">{row.country}</span><span className="text-xs text-muted">{formatNumber(row._count._all)} {activeLocale === "tr-TR" ? "ziyaret" : activeLocale === "de-DE" ? "Besuche" : "visits"}</span></div>) : <p className="text-sm text-muted">{activeLocale === "tr-TR" ? "Smart Link ziyaretleri ülke bilgisi oluşturduğunda burada görünür." : activeLocale === "de-DE" ? "Länderdaten erscheinen, sobald Smart-Link-Besuche sie erzeugen." : "Country data will appear when Smart Link visits generate it."}</p>}</div>
          </article>
          <article className="panel p-5 md:p-6">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">{t(activeLocale, "audienceSignal")}</p><h2 className="mt-2 text-lg font-semibold text-foreground">{t(activeLocale, "cityReach")}</h2></div><MapPin className="size-5 text-accent" /></div>
            <div className="mt-5 space-y-3">{data.stats.audienceCities.length > 0 ? data.stats.audienceCities.map((row) => <div className="flex items-center justify-between rounded-xl border border-line bg-surface-strong/50 px-3 py-2.5" key={row.city}><span className="text-sm font-medium">{row.city}</span><span className="text-xs text-muted">{formatNumber(row._count._all)} {activeLocale === "tr-TR" ? "ziyaret" : activeLocale === "de-DE" ? "Besuche" : "visits"}</span></div>) : <p className="text-sm text-muted">{activeLocale === "tr-TR" ? "Şehir kırılımı Smart Link trafik verisi geldikçe oluşur." : activeLocale === "de-DE" ? "Stadtaufteilungen erscheinen mit eingehendem Smart-Link-Traffic." : "City breakdowns will appear as Smart Link traffic arrives."}</p>}</div>
          </article>
          <article className="overflow-hidden rounded-[2rem] bg-[#10201d] p-5 text-white shadow-[0_18px_60px_rgba(8,35,28,0.12)] md:p-6">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">{activeLocale === "tr-TR" ? "Kampanya parametreleri" : activeLocale === "de-DE" ? "Kampagnenparameter" : "Campaign parameters"}</p><h2 className="mt-2 text-lg font-semibold">{t(activeLocale, "socialSources")}</h2></div><Share2 className="size-5 text-emerald-300" /></div>
            <p className="mt-2 text-sm leading-6 text-white/50">{activeLocale === "tr-TR" ? "TikTok, Instagram ve diğer UTM kaynaklarının Smart Link etkisini izle." : activeLocale === "de-DE" ? "Verfolge den Einfluss von TikTok, Instagram und anderen UTM-Quellen auf Smart Links." : "Track the impact of TikTok, Instagram and other UTM sources on Smart Links."}</p>
            <div className="mt-5 space-y-3">{data.stats.audienceSources.length > 0 ? data.stats.audienceSources.map((row) => <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5" key={row.utmSource}><span className="text-sm font-medium">{row.utmSource}</span><span className="text-xs text-white/50">{formatNumber(row._count._all)}</span></div>) : <p className="text-sm text-white/45">{activeLocale === "tr-TR" ? "Henüz UTM kaynağı yok." : activeLocale === "de-DE" ? "Noch keine UTM-Quelle." : "No UTM source yet."}</p>}</div>
          </article>
        </section>

        {manageableArtistsCount === 0 ? (
          <section className="panel flex flex-col gap-5 border-accent/20 bg-accent/5 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {t(activeLocale, "releaseAccess")}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">
                {t(activeLocale, "verifyArtistProfile")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                {activeLocale === "tr-TR" ? "Yeni yayın göndermek için sanatçı başvurusu yapın. Başvurunuz onaylandığında yayın sihirbazı yalnızca size bağlı sanatçı profilleriyle açılır." : activeLocale === "de-DE" ? "Bewirb dich als Künstler, um einen Release einzureichen. Nach der Freigabe öffnet sich der Assistent mit deinen verknüpften Profilen." : "Apply as an artist to submit a new release. Once approved, the release wizard opens with profiles linked to you."}
              </p>
            </div>
            <Link
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
              href="/become?reason=release-required"
            >
              {t(activeLocale, "applyArtist")}
            </Link>
          </section>
        ) : canManageArtists ? (
          <section className="panel flex flex-col gap-5 border-accent/20 bg-accent/5 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {activeLocale === "tr-TR" ? "Label çalışma alanı" : activeLocale === "de-DE" ? "Label-Arbeitsbereich" : "Label workspace"}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">
                {activeLocale === "tr-TR" ? "Tüm sanatçı profillerini tek yerden yönetin" : activeLocale === "de-DE" ? "Alle Künstlerprofile zentral verwalten" : "Manage all artist profiles in one place"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {activeLocale === "tr-TR" ? "Sanatçı profillerine, bağlantılarına ve ekip erişimlerine doğrudan ulaşın." : activeLocale === "de-DE" ? "Direkter Zugriff auf Künstlerprofile, Links und Team-Berechtigungen." : "Access artist profiles, links and team permissions directly."}
              </p>
            </div>
            <Link
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-surface px-5 py-3 text-sm font-semibold text-accent transition hover:bg-accent/10"
              href="/artists"
            >
              {t(activeLocale, "manageArtists")}
            </Link>
          </section>
        ) : null}

        <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
          <article className="panel min-w-0 overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-5 md:px-6">
              <div className="min-w-0">
                <h2 className="font-semibold text-foreground">{t(activeLocale, "latestReleases")}</h2>
                <p className="mt-1 text-sm text-muted">
                  {t(activeLocale, "latestReleasesDescription")}
                </p>
              </div>

              <Link
                className="shrink-0 text-sm font-semibold text-accent hover:opacity-80"
                href="/releases"
              >
                {t(activeLocale, "seeAll")}
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
                      {["APPROVED", "DISTRIBUTED", "LIVE"].includes(release.status) ? <Image alt={`${release.title} kapak görseli`} className="object-cover" fill sizes="48px" src={publicReleaseArtworkUrl(release.id, release.updatedAt)} unoptimized /> : release.artworkUploadId ? <Image alt={`${release.title} kapak görseli`} className="object-cover" fill sizes="48px" src={`/api/storage/private/${release.artworkUploadId}`} unoptimized /> : <Music2 className="size-5" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {release.title}
                      </p>

                      <p className="mt-1 truncate text-xs text-muted">
                        {release.artists[0]?.artist.name ?? t(activeLocale, "artistNotSpecified")}
                      </p>
                    </div>

                    <div className="hidden shrink-0 text-right sm:block">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                          release.status,
                        )}`}
                      >
                        {getStatusLabel(release.status, activeLocale)}
                      </span>

                      <p className="mt-1.5 text-[11px] text-muted">
                        {formatRelativeDate(release.updatedAt, activeLocale)}
                      </p>
                    </div>

                    <ArrowRight className="size-4 shrink-0 text-muted/40 transition group-hover:translate-x-0.5 group-hover:text-accent" />
                  </Link>
                ))
              ) : (
                <EmptyState
                  description={activeLocale === "tr-TR" ? "İlk yayınını oluşturduğunda süreç ve durum bilgileri burada görüntülenecek." : activeLocale === "de-DE" ? "Sobald du deinen ersten Release erstellst, werden Prozess und Status hier angezeigt." : "Once you create your first release, its process and status will appear here."}
                  href="/releases/new"
                  linkLabel={t(activeLocale, "newRelease")}
                  title={activeLocale === "tr-TR" ? "Henüz yayın bulunmuyor" : activeLocale === "de-DE" ? "Noch keine Releases" : "No releases yet"}
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
                {activeLocale === "tr-TR" ? "Kataloğuna göre oluşturulan içgörüler" : activeLocale === "de-DE" ? "Einblicke aus deinem Katalog" : "Insights generated from your catalog"}
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

        <section className={showManagementActivity ? "grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]" : "grid min-w-0 gap-6"}>
          <article className="panel min-w-0 p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-foreground">
                  {activeLocale === "tr-TR" ? "Katalog özeti" : activeLocale === "de-DE" ? "Katalogübersicht" : "Catalog overview"}
                </h2>

                <p className="mt-1 text-sm text-muted">
                  {activeLocale === "tr-TR" ? "Yayın sürecinin mevcut dağılımı" : activeLocale === "de-DE" ? "Aktuelle Verteilung deiner Releases" : "Current release status distribution"}
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
                    {item.value.toLocaleString(activeLocale)}
                  </p>
                </div>
              ))}
            </div>
          </article>

          {showManagementActivity ? <article className="panel min-w-0 overflow-hidden">
            <div className="border-b border-line px-5 py-5">
              <h2 className="font-semibold text-foreground">
                {activeLocale === "tr-TR" ? "Son aktiviteler" : activeLocale === "de-DE" ? "Letzte Aktivitäten" : "Recent activity"}
              </h2>

              <p className="mt-1 text-sm text-muted">
                {activeLocale === "tr-TR" ? "Organizasyondaki son hareketler" : activeLocale === "de-DE" ? "Die letzten Vorgänge in deiner Organisation" : "The latest activity in your organization"}
              </p>
            </div>

            <div className="divide-y divide-line">
              {data.recentAuditLogs.length > 0 ? (
                data.recentAuditLogs.slice(0, 5).map((log) => (
                  <div className="flex gap-3 px-5 py-4" key={log.id}>
                    <div className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {getAuditActionLabel(log.action, activeLocale)}
                      </p>

                      <p className="mt-1 truncate text-xs text-muted">
                        {log.actorUser?.name ??
                          log.actorUser?.email ??
                          (activeLocale === "tr-TR" ? "Radarune sistemi" : activeLocale === "de-DE" ? "Radarune-System" : "Radarune system")}{" "}
                        · {formatRelativeDate(log.createdAt, activeLocale)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  description={activeLocale === "tr-TR" ? "Organizasyonda yapılan işlemler burada listelenecek." : activeLocale === "de-DE" ? "Aktivitäten deiner Organisation werden hier angezeigt." : "Activity in your organization will appear here."}
                  title={activeLocale === "tr-TR" ? "Henüz aktivite bulunmuyor" : activeLocale === "de-DE" ? "Noch keine Aktivitäten" : "No activity yet"}
                />
              )}
            </div>
          </article> : null}
        </section>
        </> : null}

        <section>
          <div className="mb-4">
            <h2 className="font-semibold text-foreground">{t(activeLocale, "quickActions")}</h2>

            <p className="mt-1 text-sm text-muted">
              {t(activeLocale, "quickActionsDescription")}
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
