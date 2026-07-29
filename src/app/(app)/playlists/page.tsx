import Link from "next/link";
import { socialRepository } from "@/features/growth/server/repositories/social.repository";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { prisma } from "@/server/prisma/prisma";
import { PlaylistBrowser } from "@/features/growth/components/playlist-browser";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PlaylistsPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const playlists = await socialRepository.listPublicPlaylists();
  const tracks = await prisma.track.findMany({ where: { organizationId: organization.organization.id, release: { status: { in: ["APPROVED", "QUEUED", "PROCESSING", "DISTRIBUTED", "LIVE"] } } }, orderBy: { createdAt: "desc" }, take: 300, select: { id: true, title: true, release: { select: { title: true } }, artists: { orderBy: { sortOrder: "asc" }, select: { artist: { select: { name: true } } } } } });
  const follows = await prisma.follow.findMany({ where: { organizationId: organization.organization.id, userId: user.id }, select: { artistId: true, artist: { select: { name: true } } } });
  const followedReleases = follows.length ? await prisma.release.findMany({ where: { organizationId: organization.organization.id, status: { in: ["APPROVED", "QUEUED", "PROCESSING", "DISTRIBUTED", "LIVE"] }, artists: { some: { artistId: { in: follows.map((follow) => follow.artistId) } } } }, orderBy: { updatedAt: "desc" }, take: 30, select: { id: true, title: true, tracks: { select: { id: true } }, artists: { where: { artistId: { in: follows.map((follow) => follow.artistId) } }, select: { artist: { select: { name: true } } }, take: 1 } } }) : [];
  return (
    <main className="page-shell">
      <PlaylistBrowser tracks={tracks.map((track) => ({ id: track.id, title: track.title, releaseTitle: track.release.title, artists: track.artists.map((artist) => artist.artist.name) }))} followedReleases={followedReleases.map((release) => ({ id: release.id, title: release.title, artist: release.artists[0]?.artist.name ?? "Sanatçı", tracks: release.tracks.length }))} />
      <section className="panel p-6 md:p-8"><p className="text-xs uppercase tracking-[0.24em] text-muted">Topluluk</p><h2 className="mt-2 text-2xl font-semibold">Public playlistler</h2></section>
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
