import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { systemHealthService } from "@/features/platform/server/services/system-health.service";

export default async function AdminSystemHealthPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const checks = await systemHealthService.run(actor);
  return <AdminShell title="System Doctor" description="Secret değerleri göstermeden uygulama, veritabanı, queue ve public URL sağlığını kontrol eder."><section className="grid gap-3 sm:grid-cols-2">{checks.map((check) => <article className="panel p-5" key={check.checkKey}><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{check.checkKey}</h2><span className="text-xs font-semibold uppercase text-muted">{check.status}</span></div><p className="mt-2 text-sm text-muted">{check.message}</p></article>)}</section></AdminShell>;
}
