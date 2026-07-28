import Link from "next/link";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { distributionJobService } from "@/features/distribution-hub/server/services/distribution-job.service";
import { RetryJobButton } from "@/features/distribution-hub/components/retry-job-button";

export default async function AdminDistributionRetryPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  rbacService.redirectIfMissingEffectivePermission({ membershipRole: organization.role, permission: "distribution:view", systemRole: user.systemRole });
  const jobs = await distributionJobService.listJobs({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const retryJobs = jobs.filter((job) => job.status === "RETRY_SCHEDULED" || job.status === "FAILED");

  return (
    <main className="page-shell">
      <section className="panel p-6"><p className="text-xs uppercase tracking-[0.24em] text-muted">Distribution Operations Center</p><h1 className="mt-3 text-3xl font-semibold">Retry kuyruğu</h1><p className="mt-3 text-sm text-muted">Başarısız veya yeniden denenmesi planlanan işleri buradan izleyin.</p></section>
      <section className="panel divide-y divide-line overflow-hidden">
        {retryJobs.length === 0 ? <p className="p-8 text-center text-sm text-muted">Retry kuyruğu boş.</p> : retryJobs.map((job) => <div className="grid gap-3 p-5 md:grid-cols-[1fr_auto_auto_auto] md:items-center" key={job.id}><Link className="font-semibold hover:underline" href={`/admin/distribution/jobs/${job.id}`}>{job.releaseTitle}</Link><span className="text-sm text-muted">{job.provider} · {job.status}</span><span className="text-sm text-muted">{job.attemptCount}/{job.maxRetryCount}</span><RetryJobButton jobId={job.id} /></div>)}
      </section>
    </main>
  );
}
