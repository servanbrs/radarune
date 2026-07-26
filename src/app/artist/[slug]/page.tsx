import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import { artistPublicProfileService } from "@/features/growth/server/services/artist-public-profile.service";

export default async function ArtistPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = await artistPublicProfileService.getBySlug(slug);
  if (!artist) {
    notFound();
  }

  return (
    <PublicGrowthShell>
      <section className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Sanatçı profili</p>
        <h1 className="mt-3 text-5xl font-semibold">{artist.name}</h1>
        <p className="mt-3 text-sm text-muted">{artist._count.follows} takipçi</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <article>
            <h2 className="text-lg font-semibold">Son yayınlar</h2>
            <div className="mt-4 space-y-3">
              {artist.releaseArtistLinks.map((link) => (
                <div className="rounded-2xl border border-line bg-white p-4" key={link.id}>
                  <p className="font-semibold">{link.release.title}</p>
                  <p className="mt-1 text-xs text-muted">{link.release.primaryGenre}</p>
                </div>
              ))}
            </div>
          </article>
          <article>
            <h2 className="text-lg font-semibold">Smart Linkler</h2>
            <div className="mt-4 space-y-3">
              {artist.smartLinks.map((link) => (
                <Link className="block rounded-2xl border border-line bg-white p-4 font-semibold hover:bg-surface" href={`/l/${link.slug}`} key={link.id}>
                  {link.title}
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>
    </PublicGrowthShell>
  );
}
