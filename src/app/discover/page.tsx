import Link from "next/link";
import { Music2 } from "lucide-react";

import { toAdminActor } from "@/features/admin/server/admin-context";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { DiscoverFeedClient } from "@/features/growth/components/discover-feed-client";
import { GlobalPlaylistVoteCard } from "@/features/growth/components/global-playlist-vote-card";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import { discoverService, getCachedPublicDiscoverFeed, type DiscoverFeedItem } from "@/features/growth/server/services/discover.service";
import { globalPlaylistService } from "@/features/growth/server/services/global-playlist.service";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";

export default async function DiscoverPage() {
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
    <PublicGrowthShell currentUser={currentUser}>
      <main className="relative isolate mx-auto min-h-[calc(100vh-4rem)] w-full overflow-hidden pb-36 sm:pb-44">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_14%_10%,rgba(52,211,153,0.18),transparent_32%),radial-gradient(circle_at_84%_8%,rgba(96,165,250,0.15),transparent_34%),linear-gradient(180deg,#f8fffc_0%,#f6f9ff_55%,transparent_100%)]"
        />

        <section className="relative mx-auto max-w-4xl px-1 pb-7 pt-7 text-center sm:px-4 sm:pb-9 sm:pt-11 lg:pt-13">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-xl">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.7)]" />

            <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-700">
              Radarune Discover
            </span>
          </div>

          <h1 className="mx-auto mt-5 max-w-4xl text-balance text-[2.45rem] font-black leading-[0.98] tracking-[-0.06em] text-[#101817] sm:text-5xl lg:text-6xl xl:text-7xl">
            Sinyali yakala.
            <span className="block bg-gradient-to-r from-emerald-600 via-[#101817] to-blue-600 bg-clip-text text-transparent">
              Yeni sesi büyüt.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[#52605d] sm:text-base">
            Radarune’ın AI-uyumlu sinyal katmanı; tazelik, topluluk ilgisi ve
            sanatçı ivmesini tek bir keşif akışında görünür kılar.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-black/[0.07] bg-white/70 px-4 py-2 text-xs font-medium text-[#65706e] shadow-sm backdrop-blur">
              ← Önceki
            </span>

            <span className="rounded-full border border-black/[0.07] bg-white/70 px-4 py-2 text-xs font-medium text-[#65706e] shadow-sm backdrop-blur">
              Boşluk · Oynat
            </span>

            <span className="rounded-full border border-black/[0.07] bg-white/70 px-4 py-2 text-xs font-medium text-[#65706e] shadow-sm backdrop-blur">
              Beğen →
            </span>
          </div>
        </section>

        <section className="relative mx-auto mb-7 grid max-w-6xl gap-4 overflow-hidden rounded-[2rem] bg-[#101817] p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">AI-ready discovery layer</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">Her kartın arkasında okunabilir bir sinyal var.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Radarune Score, oy ivmesi ve içerik tazeliği; gelecekteki kişisel öneri modelleri için şeffaf ve denetlenebilir veri katmanı oluşturur.</p></div>
          <div className="relative flex flex-wrap gap-2 lg:max-w-xs lg:justify-end"><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-bold text-emerald-200">Tazelik</span><span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-bold text-white/70">Topluluk oyu</span><span className="rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-2 text-xs font-bold text-orange-200">İvme</span></div>
        </section>

        {weeklyPlaylists.length ? <section className="relative mx-auto mt-4 max-w-6xl px-4 sm:px-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Topluluk seçimi</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#101817]">Haftanın Best Şarkıları</h2><p className="mt-2 text-sm text-[#65706e]">Radarune’da yayındaki şarkıları keşfet, sanatçı profilini incele ve favorine oy ver.</p></div><span className="rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold text-[#65706e]">Haftalık oylama</span></div><div className="grid gap-4 lg:grid-cols-2">{weeklyPlaylists.filter((playlist) => playlist.featured || playlist.campaign?.active).slice(0, 4).map((playlist) => <GlobalPlaylistVoteCard key={playlist.id} playlist={{ id: playlist.id, name: playlist.name, slug: playlist.slug, description: playlist.description, featured: playlist.featured, tracks: playlist.tracks.map((item) => ({ track: item.track, release: item.release })), campaign: playlist.campaign ? { slug: playlist.campaign.slug, active: playlist.campaign.active, endsAt: playlist.campaign.endsAt.toISOString(), voteCount: playlist.campaign.voteCount } : null }} />)}</div></section> : null}

        <section className="relative px-0 sm:px-2 lg:px-4">
          {feed.length ? (
            <DiscoverFeedClient
              feed={feed}
              isAuthenticated={Boolean(session)}
            />
          ) : (
            <div className="mx-auto mt-8 max-w-2xl rounded-[2rem] border border-dashed border-black/10 bg-white/80 px-6 py-16 text-center shadow-xl backdrop-blur-xl">
              <Music2 className="mx-auto size-9 text-emerald-600" />

              <h2 className="mt-5 text-2xl font-semibold">
                Keşfet havuzu henüz boş
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
                İlk yayınlar ve onaylanmış importlar burada görünecek.
              </p>

              <Link
                className="mt-7 inline-flex rounded-full bg-[#101817] px-5 py-3 text-sm font-semibold text-white"
                href={session ? "/releases/new" : "/sign-up"}
              >
                {session ? "Yeni yayın oluştur" : "Ücretsiz üye ol"}
              </Link>
            </div>
          )}
        </section>
      </main>
    </PublicGrowthShell>
  );
}
