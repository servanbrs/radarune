import { AdminAnalyticsDetail } from "@/features/admin/components/admin-analytics-detail";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { adminV2AnalyticsService } from "@/features/admin/server/services/admin-v2-analytics.service";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";

export default async function AdminAnalyticsPage() {
  const { organization } = await authSessionService.getDashboardContext();
  const dashboard = await adminV2AnalyticsService.getDashboard(organization.organization.id);

  return (
    <AdminShell title="Detaylı kullanım analizi" description="Kullanıcılar, ziyaretçiler, yayınlar, oynatmalar ve dağıtım operasyonlarını tek ekranda inceleyin.">
      <AdminAnalyticsDetail dashboard={dashboard} />
    </AdminShell>
  );
}
