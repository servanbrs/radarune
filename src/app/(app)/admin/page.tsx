import { AdminV2Dashboard } from "@/features/admin/components/admin-v2-dashboard";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { adminV2AnalyticsService } from "@/features/admin/server/services/admin-v2-analytics.service";
import { AdminDashboardRefresh } from "@/features/admin/components/admin-dashboard-refresh";

export default async function AdminPage() {
  const { organization } = await authSessionService.getDashboardContext();
  const dashboard = await adminV2AnalyticsService.getDashboard(
    organization.organization.id,
  );

  return (
    <AdminShell
      title="Platform kontrol merkezi"
      description="Kullanıcı, yayın, keşfet ve dağıtım operasyonlarının gerçek zamanlı görünümü."
      showIntro={false}
    >
      <AdminDashboardRefresh />
      <AdminV2Dashboard dashboard={dashboard} />
    </AdminShell>
  );
}
