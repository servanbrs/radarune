import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { DeadLetterJobList } from "@/features/distribution-hub/components/dead-letter-job-list";
import { distributionOperationsService } from "@/features/distribution-hub/server/services/distribution-operations.service";

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

  return (
    <main className="page-shell">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Distribution Operations Center</p>
        <h1 className="mt-3 text-3xl font-semibold">Dead-letter kuyruğu</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Otomatik deneme sınırını aşan işleri inceleyin ve güvenli biçimde tekrar kuyruğa alın.
        </p>
      </section>
      <DeadLetterJobList jobs={jobs} />
    </main>
  );
}
