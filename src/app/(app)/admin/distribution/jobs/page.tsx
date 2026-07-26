import Link from "next/link";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { adminDistributionService } from "@/features/distribution-hub/server/services/admin-distribution.service";

export default async function AdminDistributionJobsPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  rbacService.redirectIfMissingEffectivePermission({
    membershipRole: organization.role,
    permission: "distribution:view",
    systemRole: user.systemRole,
  });

  const jobs = await adminDistributionService.listJobs({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  return (
    <main className="page-shell">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Job kuyruğu</p>
        <h1 className="mt-3 text-3xl font-semibold">Distribution jobları</h1>
      </section>
      <section className="panel divide-y divide-line overflow-hidden">
        {jobs.map((job) => (
          <Link className="grid gap-3 p-5 text-sm hover:bg-white md:grid-cols-[1fr_0.6fr_0.6fr_0.6fr]" href={`/admin/distribution/jobs/${job.id}`} key={job.id}>
            <span className="font-semibold">{job.releaseTitle}</span>
            <span>{job.provider}</span>
            <span>{job.status}</span>
            <span>{job.attemptCount}/{job.maxRetryCount}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
