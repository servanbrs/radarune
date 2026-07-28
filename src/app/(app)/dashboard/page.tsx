import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistService } from "@/features/artist/server/services/artist.service";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { dashboardService } from "@/features/dashboard/server/services/dashboard.service";
import { labelService } from "@/features/label/server/services/label.service";

export default async function DashboardPage() {
  const { organization, user } =
    await authSessionService.getDashboardContext();

  const organizationId = organization.organization.id;

  const [labels, artists, dashboard] = await Promise.all([
    labelService.listByOrganizationId(organizationId),
    artistService.listByOrganizationId(organizationId),
    dashboardService.getDashboard(organizationId),
  ]);

  return (
    <DashboardOverview
      artistsCount={artists.length}
      data={dashboard}
      labelsCount={labels.length}
      organizationName={organization.organization.name}
      userName={user.name}
    />
  );
}
