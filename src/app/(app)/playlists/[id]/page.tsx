import { notFound } from "next/navigation";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { socialService } from "@/features/growth/server/services/social.service";
import { prisma } from "@/server/prisma/prisma";
import { PlaylistManager } from "@/features/growth/components/playlist-manager";

export default async function PlaylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization, user } = await authSessionService.getDashboardContext();
  const playlist = await socialService.getPlaylistById(user.id, id);
  if (!playlist) notFound();
  const canManage = playlist.ownerUserId === user.id;
  const availableTracks = canManage
    ? await prisma.track.findMany({ where: { organizationId: organization.organization.id, release: { status: { in: ["APPROVED", "DISTRIBUTED", "LIVE"] } } }, orderBy: { createdAt: "desc" }, take: 300, select: { id: true, title: true, release: { select: { title: true } }, artists: { orderBy: { sortOrder: "asc" }, select: { artist: { select: { name: true } } } } } })
    : [];

  return (
    <main className="page-shell">
      <section className="panel p-6 md:p-8"><p className="text-xs uppercase tracking-[0.24em] text-muted">Playlist</p><h1 className="mt-3 text-3xl font-semibold">{playlist.name}</h1><p className="mt-2 text-sm text-muted">{playlist.ownerUser.name} · {playlist.tracks.length} parça · {playlist.public ? "Public" : "Özel"}</p>{playlist.description ? <p className="mt-6 max-w-2xl leading-7 text-muted">{playlist.description}</p> : null}</section>
      {canManage ? (
        <PlaylistManager playlist={playlist} availableTracks={availableTracks.map((track) => ({ id: track.id, title: track.title, releaseTitle: track.release?.title ?? "Yayın", artists: track.artists.map((item) => item.artist.name) }))} />
      ) : (
        <section className="panel p-5 md:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Parçalar</p>
          <div className="mt-5 grid gap-2">
            {playlist.tracks.map((item, index) => (
              <div className="flex items-center gap-3 rounded-xl border border-line bg-background/50 p-3" key={item.id}>
                <span className="grid size-8 place-items-center rounded-lg bg-accent/10 text-xs font-bold text-accent">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.track.title}</p>
                  <p className="truncate text-xs text-muted">{item.release?.title ?? "Yayın"}</p>
                </div>
              </div>
            ))}
            {playlist.tracks.length === 0 ? <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">Henüz parça eklenmedi.</p> : null}
          </div>
        </section>
      )}
    </main>
  );
}
