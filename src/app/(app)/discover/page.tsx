import Link from "next/link";
import { ArrowUpRight, Compass, Headphones, Sparkles } from "lucide-react";
import { GlobalPlayer } from "@/features/growth/components/global-player";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { discoverService } from "@/features/growth/server/services/discover.service";
import { globalPlaylistService } from "@/features/growth/server/services/global-playlist.service";
import { GlobalPlaylistVoteCard } from "@/features/growth/components/global-playlist-vote-card";

export default async function DiscoverPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
  const [candidates, globalPlaylists] = await Promise.all([
    discoverService.getCandidates(actor),
    globalPlaylistService.listForDiscover(organization.organization.id),
  ]);

  return (
    <main className="page-shell pb-28">
      <section className="relative overflow-hidden rounded-[2rem] border border-line bg-[#0d1218] p-6 text-white shadow-2xl shadow-black/10 md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#efb848]/15 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#efb848]/25 bg-[#efb848]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#ffd46f]">
              <Compass className="h-3.5 w-3.5" aria-hidden="true" /> Keşif alanı
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] md:text-6xl">Kataloğunuzun dışındaki sesi bulun.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/60 md:text-lg">Radarune önerileri açıklanabilir sinyallerle sıralar. Yayınlanan katalogları tür, sanatçı ve release bağlamında inceleyin.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ["01", "Dinle", "Yeni yayınları aynı akışta incele."],
              ["02", "Bağlamı gör", "Sanatçı ve release katmanına geç."],
              ["03", "Takip et", "İlham aldığın profili kaybetme."],
            ].map(([number, title, description]) => (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4" key={number}>
                <span className="font-mono text-xs text-[#efb848]">{number}</span>
                <p className="mt-3 font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-6 text-white/45">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Radarune editoryal alanı</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Global playlistler</h2></div><p className="text-sm text-muted">Gerçek oylarla şekillenen listeler</p></div>
        {globalPlaylists.length > 0 ? <div className="mt-5 grid gap-5 lg:grid-cols-2">{globalPlaylists.map((playlist) => <GlobalPlaylistVoteCard key={playlist.id} playlist={{ id: playlist.id, name: playlist.name, slug: playlist.slug, description: playlist.description, featured: playlist.featured, tracks: playlist.tracks.map((item) => ({ track: { id: item.track.id, title: item.track.title }, release: item.release })), campaign: playlist.campaign ? { slug: playlist.campaign.slug, active: playlist.campaign.active, endsAt: playlist.campaign.endsAt.toISOString(), voteCount: playlist.campaign.voteCount } : null }} />)}</div> : <div className="mt-5 rounded-[1.5rem] border border-dashed border-line bg-surface p-8 text-sm text-muted">Henüz global playlist yayınlanmadı.</div>}
      </section>

      <section className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Sizin için seçildi</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Günün yayınları</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
          Açıklanabilir öneri sıralaması
        </div>
      </section>

      {candidates.length > 0 ? (
        <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {candidates.map((release) => {
            const primaryArtist = release.artists[0]?.artist;
            return (
              <article className="group overflow-hidden rounded-[1.5rem] border border-line bg-surface transition hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/5" key={release.id}>
                <div className="relative aspect-[1.35/1] overflow-hidden bg-gradient-to-br from-[#1c2932] via-[#152019] to-[#0d1117] p-5">
                  <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-2xl" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/65">{release.primaryGenre}</span>
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"><Headphones className="h-4 w-4" aria-hidden="true" /></span>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">Release</p>
                      <p className="mt-2 text-2xl font-semibold leading-tight text-white">{release.title}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-muted">{release.artists.map((item) => item.artist.name).join(", ")}</p>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                    <span className="text-xs text-muted">Öneri skoru {release.score}</span>
                    {primaryArtist ? <Link className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-foreground" href={`/artist/${primaryArtist.slug}`}>Profili aç <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="mt-5 rounded-[1.5rem] border border-dashed border-line bg-surface p-10 text-center md:p-16">
          <Compass className="mx-auto h-8 w-8 text-accent" aria-hidden="true" />
          <h2 className="mt-5 text-2xl font-semibold">Henüz keşfedilecek yayın yok.</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted">Yayınlar admin moderasyonundan geçip yayınlandıkça bu alan gerçek katalog verileriyle dolacak. Radarune sahte öneri üretmez.</p>
          <Link className="mt-7 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white" href="/releases/new">İlk yayını hazırla <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
        </section>
      )}
      <GlobalPlayer />
    </main>
  );
}
