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

  const [labels, allArtists, dashboard, manageableArtistIds, editableArtistIds] = await Promise.all([
    labelService.listByOrganizationId(organizationId),
    artistService.listByOrganizationId(organizationId),
    dashboardService.getDashboard(organizationId),
    releaseAccessService.listManageableArtistIds(actor),
    artistProfileService.listEditableIds(actor),
  ]);
  const editableArtistIdSet = new Set(editableArtistIds);
  const artists = allArtists.filter((artist) => editableArtistIdSet.has(artist.id));

  return (
    <DashboardOverview
      artists={artists}
      artistsCount={allArtists.length}
      canManageArtists={rbacService.hasPermission(organization.role, "artist:update")}
      data={dashboard}
      labelsCount={labels.length}
      manageableArtistsCount={manageableArtistIds.length}
      organizationName={organization.organization.name}
      role={user.systemRole}
      locale={organization.organization.defaultLocale}
      userName={user.name}
    />
  );
}
