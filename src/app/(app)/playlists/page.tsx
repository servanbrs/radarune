import Link from "next/link";
import { socialRepository } from "@/features/growth/server/repositories/social.repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PlaylistsPage() {
  const playlists = await socialRepository.listPublicPlaylists();
  return (
    <main className="page-shell">
      <section className="panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Playlist</p>
        <h1 className="mt-3 text-3xl font-semibold">Public playlistler</h1>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {playlists.map((playlist) => (
          <Link className="panel block p-5" href={playlist.slug ? `/playlist/${playlist.slug}` : `/playlists/${playlist.id}`} key={playlist.id}>
            <h2 className="text-lg font-semibold">{playlist.name}</h2>
            <p className="mt-1 text-sm text-muted">{playlist.ownerUser.name} · {playlist.tracks.length} parça</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
