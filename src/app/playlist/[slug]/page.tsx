import { notFound } from "next/navigation";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import { socialRepository } from "@/features/growth/server/repositories/social.repository";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const playlist = await socialRepository.findPublicPlaylist(slug);
  return playlist
    ? { title: `${playlist.name} · Radarune`, description: playlist.description ?? `${playlist.name} playlistini Radarune'de keşfet.` }
    : { title: "Playlist · Radarune" };
}

export default async function PublicPlaylistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const playlist = await socialRepository.findPublicPlaylist(slug);
  if (!playlist) {
    notFound();
  }
  return (
    <PublicGrowthShell>
      <section className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-xl">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Radarune playlist</p><h1 className="mt-2 text-4xl font-semibold">{playlist.name}</h1><p className="mt-2 text-sm text-muted">{playlist.ownerUser.name} · {playlist.tracks.length} parça · Herkese açık</p></div>
        <div className="mt-6 space-y-3">
          {playlist.tracks.map((item) => (
            <div className="rounded-2xl border border-line bg-white p-4" key={item.id}>
              <p className="font-semibold">{item.track.title}</p>
              <p className="mt-1 text-xs text-muted">{item.release?.title ?? "Release bilgisi yok"}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicGrowthShell>
  );
}
