import Link from "next/link";
import { notFound } from "next/navigation";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { socialService } from "@/features/growth/server/services/social.service";

export default async function PlaylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await authSessionService.getDashboardContext();
  const playlist = await socialService.getPlaylistById(user.id, id);
  if (!playlist) notFound();

  return (
    <main className="page-shell">
      <section className="panel p-6 md:p-8"><p className="text-xs uppercase tracking-[0.24em] text-muted">Playlist</p><h1 className="mt-3 text-3xl font-semibold">{playlist.name}</h1><p className="mt-2 text-sm text-muted">{playlist.ownerUser.name} · {playlist.tracks.length} parça · {playlist.public ? "Public" : "Özel"}</p>{playlist.description ? <p className="mt-6 max-w-2xl leading-7 text-muted">{playlist.description}</p> : null}</section>
      <section className="panel p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">Parçalar</h2>{playlist.slug ? <Link className="text-sm font-semibold text-accent" href={`/playlist/${playlist.slug}`}>Public sayfayı aç</Link> : null}</div><div className="mt-4 grid gap-3">{playlist.tracks.map((item, index) => <div className="flex items-center gap-4 rounded-2xl border border-line p-4" key={item.id}><span className="font-mono text-xs text-muted">{String(index + 1).padStart(2, "0")}</span><div><p className="font-semibold">{item.track.title}</p><p className="mt-1 text-xs text-muted">{item.release?.title ?? "Yayın bilgisi yok"}</p></div></div>)}{playlist.tracks.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">Bu playlistte henüz parça yok.</p> : null}</div></section>
    </main>
  );
}
