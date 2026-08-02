import { AdminV2Dashboard } from "@/features/admin/components/admin-v2-dashboard";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { adminV2AnalyticsService } from "@/features/admin/server/services/admin-v2-analytics.service";

export default async function AdminV2Page() {
  const { organization } = await authSessionService.getDashboardContext();

  const dashboard = await adminV2AnalyticsService.getDashboard(
    organization.organization.id,
  );

  return <AdminV2Dashboard dashboard={dashboard} />;
}
