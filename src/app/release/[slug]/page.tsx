import Link from "next/link";
import { notFound } from "next/navigation";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import { releaseIdTokenFromSlug } from "@/features/releases/lib/release-url";
import { prisma } from "@/server/prisma/prisma";

export default async function PublicReleaseSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const token = releaseIdTokenFromSlug(slug);
  if (!token) notFound();
  const publicStatuses = ["APPROVED", "DISTRIBUTED", "LIVE"] as const;
  const publicReleaseIds = await prisma.release.findMany({
    where: { status: { in: [...publicStatuses] } },
    select: { id: true },
  });
  const releaseId = publicReleaseIds.find(({ id }) => id.startsWith(token) || id.startsWith(`cms${token}`))?.id;
  if (!releaseId) notFound();
  const release = await prisma.release.findFirst({
    where: { id: releaseId, status: { in: [...publicStatuses] } },
    select: {
      id: true,
      title: true,
      versionTitle: true,
      primaryGenre: true,
      status: true,
      liveAt: true,
      artworkUploadId: true,
      artists: { orderBy: { sortOrder: "asc" }, take: 3, select: { artist: { select: { name: true, slug: true } } } },
      tracks: {
        orderBy: [{ discNumber: "asc" }, { trackNumber: "asc" }],
        select: {
          id: true,
          title: true,
          trackNumber: true,
          isrc: true,
          artists: { orderBy: { sortOrder: "asc" }, select: { artist: { select: { name: true } } } },
        },
      },
      _count: { select: { releaseLikes: true } },
    },
  });
  if (!release) notFound();
  const session = await authSessionService.getOptionalSession();
  const artist = release.artists[0]?.artist ?? null;

  return (
    <PublicGrowthShell currentUser={session ? { name: session.user.name } : null}>
      <main className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-[2rem] border border-black/[0.08] bg-white/85 shadow-xl backdrop-blur-xl">
          <div className="grid gap-7 p-6 sm:p-9 md:grid-cols-[260px_minmax(0,1fr)] md:items-center">
            <div className="aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-200 to-slate-900 shadow-lg">
              {release.artworkUploadId ? <img alt={`${release.title} kapak görseli`} className="size-full object-cover" src={`/api/public/v1/releases/${release.id}/artwork`} /> : <div className="grid size-full place-items-center text-sm text-white/70">Kapak görseli yok</div>}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Radarune yayın</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#101817] sm:text-5xl">{release.title}</h1>
              <p className="mt-3 text-lg text-[#65706e]">{artist ? <Link className="font-semibold hover:text-emerald-700" href={`/artist/${artist.slug}`}>{artist.name}</Link> : "Radarune sanatçısı"}{release.versionTitle ? ` · ${release.versionTitle}` : ""}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-[#65706e]"><span className="rounded-full bg-black/[0.05] px-3 py-2">{release.primaryGenre}</span><span className="rounded-full bg-black/[0.05] px-3 py-2">{release.tracks.length} parça</span><span className="rounded-full bg-black/[0.05] px-3 py-2">{release._count.releaseLikes} oy</span></div>
              <p className="mt-5 text-sm leading-7 text-[#65706e]">Bu yayın Radarune’da dinlenebilir, sanatçı kanalı incelenebilir ve topluluk oyuyla desteklenebilir.</p>
            </div>
          </div>
        </section>
        <section className="mt-6 rounded-[2rem] border border-black/[0.08] bg-white/85 p-6 shadow-lg backdrop-blur-xl sm:p-9">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Yayın içeriği</p><h2 className="mt-2 text-2xl font-bold text-[#101817]">Parçalar</h2></div><span className="text-sm text-[#65706e]">Dinlemek için oynat</span></div>
          <div className="mt-5 divide-y divide-black/[0.08] overflow-hidden rounded-2xl border border-black/[0.08]">
            {release.tracks.map((track) => <article className="grid gap-3 px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center" key={track.id}><span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-sm font-bold text-emerald-700">{track.trackNumber}</span><div className="min-w-0"><p className="truncate font-semibold text-[#101817]">{track.title}</p><p className="mt-1 truncate text-xs text-[#65706e]">{track.artists.map((item) => item.artist.name).join(", ") || artist?.name || "Radarune sanatçısı"}</p></div><div className="flex items-center gap-3"><audio className="h-9 max-w-full" controls preload="none" src={`/api/public/v1/tracks/${track.id}/stream`} /><span className="hidden rounded-full border border-black/[0.08] px-3 py-1 text-xs text-[#65706e] sm:inline">{track.isrc ?? "ISRC bekleniyor"}</span></div></article>)}
          </div>
          <div className="mt-6 flex flex-wrap gap-3"><Link className="rounded-xl bg-[#101817] px-4 py-3 text-sm font-semibold text-white" href={artist ? `/artist/${artist.slug}` : "/discover"}>{artist ? "Sanatçı kanalını aç" : "Keşfete dön"}</Link><Link className="rounded-xl border border-black/[0.1] px-4 py-3 text-sm font-semibold text-[#52605d]" href="/discover">Keşfet akışına dön</Link></div>
        </section>
      </main>
    </PublicGrowthShell>
  );
}
