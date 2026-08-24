import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistService } from "@/features/artist/server/services/artist.service";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { dashboardService } from "@/features/dashboard/server/services/dashboard.service";
import { labelService } from "@/features/label/server/services/label.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { releaseAccessService } from "@/features/releases/server/services/release-access.service";
import { artistProfileService } from "@/features/artist/server/services/artist-profile.service";

export default async function DashboardPage() {
  const { organization, user } =
    await authSessionService.getDashboardContext();

  const organizationId = organization.organization.id;

  const actor = {
    organizationId,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
    email: user.email,
    name: user.name,
  };

  const [allArtists, manageableArtistIds, editableArtistIds] = await Promise.all([
    artistService.listByOrganizationId(organizationId),
    releaseAccessService.listManageableArtistIds(actor),
    artistProfileService.listEditableIds(actor),
  ]);
  const editableArtistIdSet = new Set(editableArtistIds);
  const artists = allArtists.filter((artist) => editableArtistIdSet.has(artist.id));
  const editableReleases = await artistProfileService.listEditableReleases({
    organizationId,
    systemRole: user.systemRole,
    userId: user.id,
    artistIds: editableArtistIds,
  });
  const channelReleases = editableReleases.map((release) => ({
    id: release.id,
    title: release.title,
    status: release.status,
    updatedAt: release.updatedAt.toISOString(),
    artworkUploadId: release.artworkUploadId ?? release.uploads[0]?.id ?? null,
    trackCount: release._count.tracks,
    artistIds: release.artists.map((artist) => artist.artistId),
  }));
  const isOrganizationWideRole =
    ["ADMIN", "SUPER_ADMIN"].includes(user.systemRole) ||
    ["OWNER", "ORGANIZER", "LABEL", "LABEL_MANAGER"].includes(organization.role);
  const labels = isOrganizationWideRole
    ? await labelService.listByOrganizationId(organizationId)
    : [];
  const dashboard = await dashboardService.getDashboard(organizationId, {
    artistIds: isOrganizationWideRole ? null : manageableArtistIds,
    userId: user.id,
  });

  return (
    <DashboardOverview
      artists={artists}
      channelReleases={channelReleases}
      artistsCount={artists.length}
      canManageArtists={rbacService.hasPermission(organization.role, "artist:update")}
      data={dashboard}
      labelsCount={labels.length}
      manageableArtistsCount={manageableArtistIds.length}
      showManagementActivity={isOrganizationWideRole}
      showCatalogAnalytics={isOrganizationWideRole || artists.length > 0}
      organizationName={organization.organization.name}
      role={user.systemRole}
      locale={organization.organization.defaultLocale}
      userName={user.name}
    />
  );
}
