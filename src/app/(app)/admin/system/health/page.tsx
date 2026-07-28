import { AdminShell } from "@/features/admin/components/admin-shell";
import { SystemHealthDashboard } from "@/features/admin/components/system-health/system-health-dashboard";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { systemHealthService } from "@/features/platform/server/services/system-health.service";

export default async function AdminSystemHealthPage() {
  const { organization, user } =
    await authSessionService.getDashboardContext();

  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  const report = await systemHealthService.run(actor);

  return (
    <AdminShell
      title="System Doctor"
      description="Secret değerlerini göstermeden veritabanı, uygulama yapılandırması, queue ve servis sağlığını kontrol eder."
    >
      <SystemHealthDashboard initialReport={report} />
    </AdminShell>
  );
}
