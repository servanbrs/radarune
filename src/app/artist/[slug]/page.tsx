import Link from "next/link";
import { notFound } from "next/navigation";
import { DiscoverArtistFollowButton } from "@/features/growth/components/discover-artist-follow-button";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import { artistPublicProfileService } from "@/features/growth/server/services/artist-public-profile.service";
import { StructuredData } from "@/features/seo/components/structured-data";
import { ArtistProfileShareButton } from "@/features/artist/components/artist-profile-share-button";
import { socialRepository } from "@/features/growth/server/repositories/social.repository";
import { ArtistMediaPlayer } from "@/features/artist/components/artist-media-player";
import { releasePublicPath } from "@/features/releases/lib/release-url";
import { getRequestLocale } from "@/lib/i18n-server";
import { ArtistProfileViewTracker } from "@/features/growth/components/artist-profile-view-tracker";
import { PublicArtworkImage } from "@/features/releases/components/public-artwork-image";
import { publicReleaseArtworkUrl } from "@/features/releases/lib/public-artwork-url";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = await artistPublicProfileService.getBySlug(slug);
  if (!artist) return { title: "Sanatçı bulunamadı | Radarune" };
  const title = artist.seoTitle ?? `${artist.name} | Radarune`;
  const description = artist.seoDescription ?? artist.shortBiography ?? `${artist.name} sanatçı profilini, yayınlarını ve Radarune keşif oylarını incele.`;
  return { title, description, alternates: { canonical: `/artist/${artist.slug}` }, openGraph: { title, description, type: "profile", url: `/artist/${artist.slug}`, images: artist.ogImageUrl ?? artist.coverImageUrl ?? artist.profileImageUrl ? [artist.ogImageUrl ?? artist.coverImageUrl ?? artist.profileImageUrl ?? ""] : [] } };
}

export default async function ArtistPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = await artistPublicProfileService.getBySlug(slug);
  if (!artist) {
    notFound();
  }
  const session = await authSessionService.getOptionalSession();
  const locale = await getRequestLocale();
  const initialFollowing = session ? await socialRepository.isFollowing(session.user.id, artist.id) : false;

  return (
    <PublicGrowthShell currentUser={session ? { name: session.user.name } : null} locale={locale}>
      <ArtistProfileViewTracker artistId={artist.id} />
      <StructuredData data={{ "@context": "https://schema.org", "@type": artist.type === "SOLO" ? "Person" : "MusicGroup", name: artist.name, url: `https://radarune.com/artist/${artist.slug}`, image: artist.profileImageUrl ?? artist.coverImageUrl ?? undefined, description: artist.seoDescription ?? artist.shortBiography ?? undefined, sameAs: [artist.spotifyProfileUrl, artist.appleMusicProfileUrl, artist.youtubeProfileUrl, artist.instagramProfileUrl, artist.tiktokProfileUrl, artist.websiteUrl].filter((value): value is string => Boolean(value)) }} />
      <section className="panel overflow-hidden p-0">
        <div className="relative min-h-64 overflow-hidden bg-surface-strong p-8 md:p-12">
          {artist.coverImageUrl ? <div aria-hidden className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: `url(${artist.coverImageUrl})` }} /> : null}
        <div className="relative flex flex-wrap items-end gap-6">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-line bg-surface text-3xl font-semibold text-accent">
              {artist.profileImageUrl ? <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${artist.profileImageUrl})` }} /> : artist.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-xs uppercase tracking-[0.24em] text-accent">Radarune artist channel</p><span className="inline-flex items-center gap-1 rounded-full bg-emerald-300/15 px-2.5 py-1 text-[10px] font-bold text-emerald-800"><span className="size-1.5 rounded-full bg-emerald-500" />{artist.publicStats.verified ? "Doğrulanmış sanatçı" : "Radarune sanatçı profili"}</span></div><h1 className="mt-2 text-4xl font-semibold md:text-5xl">{artist.name}</h1><p className="mt-2 text-sm text-muted">{artist.type === "SOLO" ? "Solo sanatçı" : artist.type} · herkese açık sanatçı kanalı</p><div className="mt-4 flex flex-wrap gap-2"><DiscoverArtistFollowButton artistId={artist.id} initialFollowing={initialFollowing} isAuthenticated={Boolean(session)} /><ArtistProfileShareButton slug={artist.slug} />{session && (artist.ownerUserId === session.user.id || artist.createdByUserId === session.user.id) ? <Link className="inline-flex items-center rounded-xl border border-line px-3 py-2 text-xs font-semibold hover:border-accent" href={`/artist-profile/analytics?artistId=${encodeURIComponent(artist.id)}`}>Kanal analizleri</Link> : null}</div></div>
          </div>
        </div>
        <nav aria-label="Sanatçı kanalı" className="flex gap-1 overflow-x-auto border-b border-line px-6 py-3 md:px-10"><a className="shrink-0 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background" href="#releases">Yayınlar</a><a className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-muted hover:bg-surface-strong" href="#about">Hakkında</a><a className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-muted hover:bg-surface-strong" href="#links">Bağlantılar</a></nav>
        <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="mb-7 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface-strong p-2 text-center sm:grid-cols-4"><div className="rounded-xl bg-background p-3"><p className="text-xl font-bold">{artist.publicStats.publishedReleaseCount}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-muted">Yayın</p></div><div className="rounded-xl bg-background p-3"><p className="text-xl font-bold">{artist.publicStats.totalStreams.toLocaleString("tr-TR")}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-muted">Dinlenme</p></div><div className="rounded-xl bg-background p-3"><p className="text-xl font-bold">{artist.publicStats.totalReleaseVotes}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-muted">Toplam oy</p></div><div className="rounded-xl bg-background p-3"><p className="text-xl font-bold">{artist._count.follows}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-muted">Takipçi</p></div></div>
            <div id="about">{artist.shortBiography || artist.biography ? <p className="max-w-2xl whitespace-pre-line text-base leading-7 text-muted">{artist.biography ?? artist.shortBiography}</p> : <p className="text-sm text-muted">Bu sanatçı profilini yakında güncelleyecek.</p>}</div>
            <h2 className="mt-10 text-xl font-semibold" id="releases">Son yayınlar</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {artist.releaseArtistLinks.map((link) => <Link className="group overflow-hidden rounded-2xl border border-line bg-surface-strong" href={releasePublicPath(link.release.title, link.release.id)} key={link.id}><div className="aspect-square bg-gradient-to-br from-accent/30 to-surface-strong"><PublicArtworkImage alt={`${link.release.title} kapak`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={publicReleaseArtworkUrl(link.release.id, link.release.updatedAt)} /></div><div className="p-4"><p className="font-semibold group-hover:text-accent">{link.release.title}</p><div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted"><span>{link.release.primaryGenre}</span><span>{link.release._count.releaseLikes} oy</span></div></div></Link>)}
              {null}
            </div>
            <ArtistMediaPlayer items={artist.externalMediaSources} />
            <h2 className="mt-10 text-xl font-semibold">Öne çıkanlar · en çok oy alanlar</h2>
            <div className="mt-4 space-y-2">{[...artist.releaseArtistLinks].sort((a, b) => b.release._count.releaseLikes - a.release._count.releaseLikes).slice(0, 5).map((link) => <div className="flex items-center justify-between rounded-2xl border border-line bg-surface-strong px-4 py-3" key={`popular-${link.id}`}><span className="font-medium">{link.release.title}</span><span className="text-xs text-muted">{link.release._count.releaseLikes} oy</span></div>)}</div>
          </div>
          <aside className="space-y-6" id="links">
            <article><h2 className="text-xl font-semibold">Platformlar</h2><div className="mt-4 grid gap-2">{[artist.spotifyProfileUrl && ["Spotify", artist.spotifyProfileUrl], artist.youtubeProfileUrl && ["YouTube", artist.youtubeProfileUrl], artist.appleMusicProfileUrl && ["Apple Music", artist.appleMusicProfileUrl]].filter((value): value is [string, string] => Boolean(value)).map(([label, url]) => <a className="rounded-2xl border border-line bg-surface-strong p-4 text-sm font-semibold hover:border-accent" href={url} key={label} rel="noreferrer" target="_blank">{label} ↗</a>)}</div></article>
            <article><h2 className="text-xl font-semibold">Smart Linkler</h2><div className="mt-4 space-y-3">{artist.smartLinks.map((link) => <Link className="block rounded-2xl border border-line bg-surface-strong p-4 font-semibold hover:border-accent" href={`/l/${link.slug}`} key={link.id}>{link.title} ↗</Link>)}{artist.smartLinks.length === 0 ? <p className="text-sm text-muted">Henüz Smart Link yok.</p> : null}</div></article>
          </aside>
        </div>
      </section>
    </PublicGrowthShell>
  );
}
