import { AdminShell } from "@/features/admin/components/admin-shell";
import { globalPlaylistService } from "@/features/growth/server/services/global-playlist.service";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { GlobalPlaylistManager } from "@/features/growth/components/global-playlist-manager";

export default async function AdminGlobalPlaylistsPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const data = await globalPlaylistService.listForAdmin(actor);
  const playlists = data.playlists.map((playlist) => ({
    id: playlist.id,
    name: playlist.name,
    slug: playlist.slug,
    description: playlist.description,
    featured: playlist.featured,
    tracks: playlist.tracks.map((item) => ({ id: item.id, track: item.track, release: item.release })),
    campaign: playlist.campaign ? { id: playlist.campaign.id, slug: playlist.campaign.slug, active: playlist.campaign.active, endsAt: playlist.campaign.endsAt.toISOString(), voteCount: playlist.campaign.voteCount } : null,
  }));
  const userPlaylists = data.userPlaylists.map((playlist) => ({
    id: playlist.id,
    name: playlist.name,
    slug: playlist.slug,
    description: playlist.description,
    public: playlist.public,
    owner: playlist.ownerUser,
    tracks: playlist.tracks.map((item) => ({ id: item.id, trackId: item.track.id, track: item.track, release: item.release })),
  }));
  return <AdminShell title="Global playlistler" description="Keşfet alanında yayınlanan playlistleri ve kullanıcıların oluşturduğu listeleri yönetin."><GlobalPlaylistManager initialPlaylists={playlists} userPlaylists={userPlaylists} tracks={data.tracks} /></AdminShell>;
}
