import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import { artistPublicProfileService } from "@/features/growth/server/services/artist-public-profile.service";

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

  return (
    <PublicGrowthShell>
      <section className="panel overflow-hidden p-0">
        <div className="relative min-h-64 overflow-hidden bg-surface-strong p-8 md:p-12">
          {artist.coverImageUrl ? <div aria-hidden className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: `url(${artist.coverImageUrl})` }} /> : null}
        <div className="relative flex flex-wrap items-end gap-6">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-line bg-surface text-3xl font-semibold text-accent">
              {artist.profileImageUrl ? <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${artist.profileImageUrl})` }} /> : artist.name.slice(0, 1).toUpperCase()}
            </div>
            <div><p className="text-xs uppercase tracking-[0.24em] text-accent">Radarune artist channel</p><h1 className="mt-2 text-4xl font-semibold md:text-5xl">{artist.name}</h1><p className="mt-2 text-sm text-muted">{artist.type === "SOLO" ? "Solo sanatçı" : artist.type} · Radarune’da yayınlanan resmi profil</p></div>
          </div>
        </div>
        <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="mb-7 grid grid-cols-3 gap-2 rounded-2xl border border-line bg-surface-strong p-2 text-center"><div className="rounded-xl bg-background p-3"><p className="text-xl font-bold">{artist.releaseArtistLinks.length}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-muted">Yayın</p></div><div className="rounded-xl bg-background p-3"><p className="text-xl font-bold">{artist.releaseArtistLinks.reduce((total, item) => total + item.release._count.releaseLikes, 0)}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-muted">Toplam oy</p></div><div className="rounded-xl bg-background p-3"><p className="text-xl font-bold">{artist._count.follows}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-muted">Takipçi</p></div></div>
            {artist.shortBiography || artist.biography ? <p className="max-w-2xl whitespace-pre-line text-base leading-7 text-muted">{artist.biography ?? artist.shortBiography}</p> : <p className="text-sm text-muted">Bu sanatçı profilini yakında güncelleyecek.</p>}
            <h2 className="mt-10 text-xl font-semibold">Son yayınlar</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {artist.releaseArtistLinks.map((link) => <Link className="group overflow-hidden rounded-2xl border border-line bg-surface-strong" href={`/releases/${link.release.id}`} key={link.id}><div className="aspect-square bg-gradient-to-br from-accent/30 to-surface-strong">{link.release.artworkUploadId ? <img alt={`${link.release.title} kapak`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={`/api/public/v1/releases/${link.release.id}/artwork`} /> : null}</div><div className="p-4"><p className="font-semibold group-hover:text-accent">{link.release.title}</p><div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted"><span>{link.release.primaryGenre}</span><span>{link.release._count.releaseLikes} oy</span></div></div></Link>)}
              {artist.externalMediaSources.map((item) => <a className="group rounded-2xl border border-line bg-surface-strong p-4" href={item.externalUrl} key={item.id} rel="noreferrer" target="_blank"><div className="flex items-center gap-3">{item.thumbnailUrl ? <div className="h-12 w-12 shrink-0 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${item.thumbnailUrl})` }} /> : null}<div className="min-w-0"><p className="truncate font-semibold group-hover:text-accent">{item.title}</p><p className="mt-1 text-xs text-muted">{item.provider === "YOUTUBE" ? "YouTube" : "Spotify"}</p></div></div></a>)}
            </div>
            <h2 className="mt-10 text-xl font-semibold">Popüler yayınlar</h2>
            <div className="mt-4 space-y-2">{[...artist.releaseArtistLinks].sort((a, b) => b.release._count.releaseLikes - a.release._count.releaseLikes).slice(0, 5).map((link) => <div className="flex items-center justify-between rounded-2xl border border-line bg-surface-strong px-4 py-3" key={`popular-${link.id}`}><span className="font-medium">{link.release.title}</span><span className="text-xs text-muted">{link.release._count.releaseLikes} oy</span></div>)}</div>
          </div>
          <aside className="space-y-6">
            <article><h2 className="text-xl font-semibold">Platformlar</h2><div className="mt-4 grid gap-2">{[artist.spotifyProfileUrl && ["Spotify", artist.spotifyProfileUrl], artist.youtubeProfileUrl && ["YouTube", artist.youtubeProfileUrl], artist.appleMusicProfileUrl && ["Apple Music", artist.appleMusicProfileUrl]].filter((value): value is [string, string] => Boolean(value)).map(([label, url]) => <a className="rounded-2xl border border-line bg-surface-strong p-4 text-sm font-semibold hover:border-accent" href={url} key={label} rel="noreferrer" target="_blank">{label} ↗</a>)}</div></article>
            <article><h2 className="text-xl font-semibold">Smart Linkler</h2><div className="mt-4 space-y-3">{artist.smartLinks.map((link) => <Link className="block rounded-2xl border border-line bg-surface-strong p-4 font-semibold hover:border-accent" href={`/l/${link.slug}`} key={link.id}>{link.title} ↗</Link>)}{artist.smartLinks.length === 0 ? <p className="text-sm text-muted">Henüz Smart Link yok.</p> : null}</div></article>
          </aside>
        </div>
      </section>
    </PublicGrowthShell>
  );
}
