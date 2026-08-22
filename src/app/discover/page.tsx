import Link from "next/link";
import type { Metadata } from "next";
import { Music2 } from "lucide-react";

import { toAdminActor } from "@/features/admin/server/admin-context";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { DiscoverFeedClient } from "@/features/growth/components/discover-feed-client";
import { GlobalPlaylistVoteCard } from "@/features/growth/components/global-playlist-vote-card";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import { discoverService, getCachedPublicDiscoverFeed, type DiscoverFeedItem } from "@/features/growth/server/services/discover.service";
import { globalPlaylistService } from "@/features/growth/server/services/global-playlist.service";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";
import { getRequestLocale } from "@/lib/i18n-server";
import { localize } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Keşfet | Yeni müzikleri dinle ve oy ver | Radarune",
  description:
    "Radarune Keşfet’te bağımsız sanatçıların yeni şarkılarını dinle, beğen, oy ver ve yükselen müzikleri ilk sen keşfet.",
  keywords: [
    "yeni müzikler",
    "müzik keşfet",
    "bağımsız sanatçılar",
    "yeni şarkılar",
    "Radarune keşfet",
  ],
  alternates: { canonical: "/discover" },
  openGraph: {
    title: "Keşfet | Yeni müzikleri dinle ve oy ver | Radarune",
    description:
      "Yeni yayınları dinle, sanatçıları takip et ve Radarune topluluğunun yükselen şarkılarını keşfet.",
    url: "/discover",
    type: "website",
    siteName: "Radarune",
  },
  twitter: {
    card: "summary",
    title: "Keşfet | Radarune",
    description: "Yeni müzikleri keşfet, dinle ve oy ver.",
  },
  robots: { index: true, follow: true },
};

// Keşfet akışı ağırlıklı rastgele sırayla üretilir. Statik/RSC önbelleği ilk
// kartı sabitlemesin; her giriş ve yenileme yeni bir seçim yapabilsin.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DiscoverPage() {
  const locale = await getRequestLocale();
  const session = await authSessionService.getOptionalSession();

  const dashboard = session
    ? await authSessionService.getDashboardContext()
    : null;

  const actor = dashboard
    ? toAdminActor({
        organizationId: dashboard.organization.organization.id,
        membershipRole: dashboard.organization.role,
        systemRole: dashboard.user.systemRole,
        userId: dashboard.user.id,
      })
    : undefined;

  const tenant = dashboard?.organization.organization ?? await tenantContextService.resolveFromRequest();
  let feed: DiscoverFeedItem[] = [];
  try {
    feed = actor
      ? await discoverService.getFeed(actor, tenant?.id)
      : await getCachedPublicDiscoverFeed(tenant?.id);
  } catch {
    // Render the empty state instead of taking the public discovery page down.
  }
  let weeklyPlaylists: Awaited<ReturnType<typeof globalPlaylistService.listForDiscover>> = [];
  try {
    weeklyPlaylists = tenant ? await globalPlaylistService.listForDiscover(tenant.id) : [];
  } catch {
    // Playlist data is additive; discovery remains usable without it.
  }
  const currentUser = session ? { name: session.user.name, username: "username" in session.user && typeof session.user.username === "string" ? session.user.username : null } : null;

  return (
    <PublicGrowthShell currentUser={currentUser} locale={locale}>
      <main className="relative isolate mx-auto flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col overflow-x-hidden pb-10 sm:pb-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_14%_10%,rgba(52,211,153,0.18),transparent_32%),radial-gradient(circle_at_84%_8%,rgba(96,165,250,0.15),transparent_34%),linear-gradient(180deg,#f8fffc_0%,#f6f9ff_55%,transparent_100%)]"
        />

        <section className="relative mx-auto max-w-4xl px-1 pb-7 pt-7 text-center sm:px-4 sm:pb-9 sm:pt-11 lg:pt-13">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-xl">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.7)]" />

            <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-700">
              {localize(locale, { tr: "Radarune Keşfet", en: "Radarune Discover", de: "Radarune Entdecken" })}
            </span>
          </div>

          <h1 className="mx-auto mt-5 max-w-4xl text-balance text-[2.45rem] font-black leading-[0.98] tracking-[-0.06em] text-[#101817] sm:text-5xl lg:text-6xl xl:text-7xl">
            {localize(locale, { tr: "Sinyali yakala.", en: "Catch the signal.", de: "Fang das Signal ein." })}
            <span className="block bg-gradient-to-r from-emerald-600 via-[#101817] to-blue-600 bg-clip-text text-transparent">
              {localize(locale, { tr: "Yeni sesi büyüt.", en: "Amplify the new sound.", de: "Verstärke den neuen Sound." })}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[#52605d] sm:text-base">
            {localize(locale, { tr: "Radarune’ın AI-uyumlu sinyal katmanı; tazelik, topluluk ilgisi ve sanatçı ivmesini tek bir keşif akışında görünür kılar.", en: "Radarune’s AI-ready signal layer brings freshness, community interest and artist momentum together in one discovery feed.", de: "Radarunes KI-fähige Signalschicht macht Aktualität, Community-Interesse und Künstlerdynamik in einem Entdeckungsfeed sichtbar." })}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-black/[0.07] bg-white/70 px-4 py-2 text-xs font-medium text-[#65706e] shadow-sm backdrop-blur">
              {localize(locale, { tr: "← Önceki", en: "← Previous", de: "← Zurück" })}
            </span>

            <span className="rounded-full border border-black/[0.07] bg-white/70 px-4 py-2 text-xs font-medium text-[#65706e] shadow-sm backdrop-blur">
              {localize(locale, { tr: "Boşluk · Oynat", en: "Space · Play", de: "Leertaste · Abspielen" })}
            </span>

            <span className="rounded-full border border-black/[0.07] bg-white/70 px-4 py-2 text-xs font-medium text-[#65706e] shadow-sm backdrop-blur">
              {localize(locale, { tr: "Beğen →", en: "Like →", de: "Gefällt mir →" })}
            </span>
          </div>
        </section>

        <section className="relative mx-auto mb-7 grid max-w-6xl gap-4 overflow-hidden rounded-[2rem] bg-[#101817] p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">AI-ready discovery layer</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">{localize(locale, { tr: "Her kartın arkasında okunabilir bir sinyal var.", en: "Every card has a readable signal behind it.", de: "Hinter jeder Karte steckt ein lesbares Signal." })}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">{localize(locale, { tr: "Radarune Score, oy ivmesi ve içerik tazeliği; gelecekteki kişisel öneri modelleri için şeffaf ve denetlenebilir veri katmanı oluşturur.", en: "Radarune Score, vote momentum and content freshness create a transparent, auditable data layer for future recommendations.", de: "Radarune Score, Abstimmungsdynamik und Aktualität bilden eine transparente, prüfbare Datengrundlage für künftige Empfehlungen." })}</p></div>
          <div className="relative flex flex-wrap gap-2 lg:max-w-xs lg:justify-end"><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-bold text-emerald-200">{localize(locale, { tr: "Tazelik", en: "Freshness", de: "Aktualität" })}</span><span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-bold text-white/70">{localize(locale, { tr: "Topluluk oyu", en: "Community votes", de: "Community-Stimmen" })}</span><span className="rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-2 text-xs font-bold text-orange-200">{localize(locale, { tr: "İvme", en: "Momentum", de: "Dynamik" })}</span></div>
        </section>

        {weeklyPlaylists.length ? <section className="relative mx-auto mt-4 max-w-6xl px-4 sm:px-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">{localize(locale, { tr: "Topluluk seçimi", en: "Community picks", de: "Community-Auswahl" })}</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#101817]">{localize(locale, { tr: "Haftanın öne çıkanları", en: "This week’s highlights", de: "Highlights der Woche" })}</h2><p className="mt-2 text-sm text-[#65706e]">{localize(locale, { tr: "Radarune’da yayındaki şarkıları keşfet, sanatçı profilini incele ve favorine oy ver.", en: "Discover live Radarune songs, explore artist profiles and vote for your favorite.", de: "Entdecke verfügbare Radarune-Songs, öffne Künstlerprofile und stimme für deine Favoriten." })}</p></div><span className="rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-[#65706e]">{localize(locale, { tr: "Haftalık oylama", en: "Weekly voting", de: "Wöchentliche Abstimmung" })}</span></div><div className="grid gap-4 lg:grid-cols-2">{weeklyPlaylists.filter((playlist) => playlist.featured || playlist.campaign?.active).slice(0, 4).map((playlist) => <GlobalPlaylistVoteCard key={playlist.id} playlist={{ id: playlist.id, name: playlist.name, slug: playlist.slug, description: playlist.description, featured: playlist.featured, tracks: playlist.tracks.map((item) => ({ track: item.track, release: item.release })), campaign: playlist.campaign ? { slug: playlist.campaign.slug, active: playlist.campaign.active, endsAt: playlist.campaign.endsAt.toISOString(), voteCount: playlist.campaign.voteCount } : null }} />)}</div></section> : null}

        <section className="relative px-0 sm:px-2 lg:px-4">
          {feed.length ? (
            <DiscoverFeedClient
              feed={feed}
              isAuthenticated={Boolean(session)}
              locale={locale}
            />
          ) : (
            <div className="mx-auto mt-8 max-w-2xl rounded-[2rem] border border-dashed border-black/10 bg-white/80 px-6 py-16 text-center shadow-xl backdrop-blur-xl">
              <Music2 className="mx-auto size-9 text-emerald-600" />

              <h2 className="mt-5 text-2xl font-semibold">
                {localize(locale, { tr: "Keşfet havuzu henüz boş", en: "The discovery pool is empty", de: "Der Entdeckungspool ist noch leer" })}
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
                {localize(locale, { tr: "İlk yayınlar ve onaylanmış importlar burada görünecek.", en: "The first releases and approved imports will appear here.", de: "Die ersten Releases und bestätigten Importe erscheinen hier." })}
              </p>

              <Link
                className="mt-7 inline-flex rounded-full bg-[#101817] px-5 py-3 text-sm font-semibold text-white"
                href={session ? "/releases/new" : "/sign-up"}
              >
                {session ? localize(locale, { tr: "Yeni yayın oluştur", en: "Create a release", de: "Release erstellen" }) : localize(locale, { tr: "Ücretsiz üye ol", en: "Join for free", de: "Kostenlos registrieren" })}
              </Link>
            </div>
          )}
        </section>
      </main>
    </PublicGrowthShell>
  );
}
