import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import { PublicTrackPlayer } from "@/features/growth/components/public-track-player";
import { PublicArtworkImage } from "@/features/releases/components/public-artwork-image";
import { publicReleaseArtworkUrl } from "@/features/releases/lib/public-artwork-url";
import { prisma } from "@/server/prisma/prisma";
import { getRequestLocale } from "@/lib/i18n-server";

type Props = { params: Promise<{ id: string }> };
const publicStatuses = ["APPROVED", "DISTRIBUTED", "LIVE"] as const;

async function getTrack(id: string) {
  return prisma.track.findFirst({
    where: { id, release: { status: { in: [...publicStatuses] } } },
    select: {
      id: true,
      title: true,
      versionTitle: true,
      trackNumber: true,
      isrc: true,
      durationMs: true,
      release: {
        select: {
          id: true,
          title: true,
          primaryGenre: true,
          artworkUploadId: true,
          updatedAt: true,
          artists: {
            orderBy: { sortOrder: "asc" },
            take: 5,
            select: { artist: { select: { name: true, slug: true } } },
          },
        },
      },
      artists: {
        orderBy: { sortOrder: "asc" },
        select: { artist: { select: { name: true, slug: true } } },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const track = await getTrack(id);
  if (!track) return { title: "Şarkı bulunamadı | Radarune" };
  const artists = track.artists.map(({ artist }) => artist.name).join(", ") || track.release.artists.map(({ artist }) => artist.name).join(", ");
  return {
    title: `${track.title} · ${artists || "Radarune"} | Radarune`,
    description: `${artists || "Radarune sanatçısı"} tarafından yayınlanan ${track.title} şarkısını Radarune'da dinle.`,
    alternates: { canonical: `/track/${track.id}` },
    openGraph: { title: `${track.title} | Radarune`, description: `${artists || "Radarune"} · Radarune'da dinle`, images: [`/api/public/v1/releases/${track.release.id}/artwork?v=${track.release.updatedAt.getTime()}`] },
  };
}

export default async function PublicTrackPage({ params }: Props) {
  const { id } = await params;
  const [track, session] = await Promise.all([getTrack(id), authSessionService.getOptionalSession()]);
  if (!track) notFound();
  const locale = await getRequestLocale();
  const artists = track.artists.length ? track.artists : track.release.artists;

  return (
    <PublicGrowthShell currentUser={session ? { name: session.user.name } : null} locale={locale}>
      <main className="mx-auto w-full max-w-5xl">
        <section className="overflow-hidden rounded-[2.4rem] bg-[#071612] text-white shadow-[0_30px_100px_rgba(4,24,20,0.25)]">
          <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[minmax(240px,360px)_1fr] md:items-center">
            <div className="aspect-square overflow-hidden rounded-[2rem] bg-[#142521] shadow-2xl">
              {track.release.artworkUploadId ? <PublicArtworkImage alt={`${track.title} kapak görseli`} className="size-full object-cover" src={publicReleaseArtworkUrl(track.release.id, track.release.updatedAt)} /> : <div className="grid size-full place-items-center text-white/45">Kapak görseli yok</div>}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#54e7c2]">RADARUNE ŞARKI SAYFASI</p>
              <h1 className="mt-4 break-words text-4xl font-black tracking-[-0.055em] sm:text-6xl">{track.title}</h1>
              <p className="mt-4 text-lg text-white/65">{artists.length ? artists.map(({ artist }, index) => <span key={artist.slug}>{index ? ", " : ""}<Link className="hover:text-[#54e7c2]" href={`/artist/${artist.slug}`}>{artist.name}</Link></span>) : "Radarune sanatçısı"}</p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-white/60"><span className="rounded-full bg-white/10 px-3 py-2">{track.release.primaryGenre}</span><span className="rounded-full bg-white/10 px-3 py-2">{track.release.title}</span>{track.isrc ? <span className="rounded-full bg-white/10 px-3 py-2">ISRC {track.isrc}</span> : null}</div>
              <div className="mt-8 max-w-xl"><PublicTrackPlayer title={track.title} trackId={track.id} /></div>
            </div>
          </div>
        </section>
        <section className="mt-6 rounded-[2rem] border border-black/[0.08] bg-white/85 p-6 shadow-lg sm:p-9"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#087d70]">YAYIN</p><h2 className="mt-2 text-2xl font-black text-[#101817]">{track.release.title}</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#65706e]">Bu şarkı Radarune topluluğunda dinlenebilir. Sanatçı kanalını açabilir, yayını paylaşabilir ve yeni keşiflere devam edebilirsin.</p><Link className="mt-6 inline-flex rounded-xl bg-[#101817] px-4 py-3 text-sm font-bold text-white" href="/discover">Keşfet akışına dön</Link></section>
      </main>
    </PublicGrowthShell>
  );
}
