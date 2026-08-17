import { notFound } from "next/navigation";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { PlaylistManager } from "@/features/growth/components/playlist-manager";
import { socialService } from "@/features/growth/server/services/social.service";
import { prisma } from "@/server/prisma/prisma";

export default async function PlaylistEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization, user } = await authSessionService.getDashboardContext();
  const playlist = await socialService.getOwnedPlaylistById(user.id, id);
  if (!playlist) notFound();

  const availableTracks = await prisma.track.findMany({
    where: {
      organizationId: organization.organization.id,
      release: { status: { in: ["APPROVED", "DISTRIBUTED", "LIVE"] } },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true,
      title: true,
      release: { select: { title: true } },
      artists: {
        orderBy: { sortOrder: "asc" },
        select: { artist: { select: { name: true } } },
      },
    },
  });

  return (
    <main className="page-shell">
      <section className="panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Playlist düzenleme</p>
        <h1 className="mt-3 text-3xl font-semibold">{playlist.name}</h1>
        <p className="mt-2 text-sm text-muted">Yalnızca size ait playlistleri düzenleyebilirsiniz.</p>
      </section>
      <PlaylistManager
        playlist={playlist}
        availableTracks={availableTracks.map((track) => ({
          id: track.id,
          title: track.title,
          releaseTitle: track.release?.title ?? "Yayın",
          artists: track.artists.map((item) => item.artist.name),
        }))}
      />
    </main>
  );
}
