import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { DeadLetterJobList } from "@/features/distribution-hub/components/dead-letter-job-list";
import { distributionOperationsService } from "@/features/distribution-hub/server/services/distribution-operations.service";
import { AdminShell } from "@/features/admin/components/admin-shell";

export default async function AdminDistributionDeadLetterPage() {
  const { organization, user } = await authSessionService.getDashboardContext();

  rbacService.redirectIfMissingEffectivePermission({
    membershipRole: organization.role,
    permission: "distribution:view",
    systemRole: user.systemRole,
  });

  const jobs = await distributionOperationsService.listDeadLetterJobs({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  return <AdminShell title="Dead-letter kuyruğu" description="Otomatik deneme sınırını aşan işleri inceleyin ve güvenli biçimde tekrar kuyruğa alın.">
      <DeadLetterJobList jobs={jobs} />
    </AdminShell>;
}
