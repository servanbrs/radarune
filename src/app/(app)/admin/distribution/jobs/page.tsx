import Link from "next/link";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { adminDistributionService } from "@/features/distribution-hub/server/services/admin-distribution.service";
import { AdminShell } from "@/features/admin/components/admin-shell";

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

  const statusCounts = jobs.reduce<Record<string, number>>((counts, job) => {
    counts[job.status] = (counts[job.status] ?? 0) + 1;
    return counts;
  }, {});

  return <AdminShell title="Distribution jobları" description="Dağıtım kuyruğundaki işleri, deneme durumlarını ve hata ayrıntılarını tek listeden izleyin.">
    <div className="grid gap-3 sm:grid-cols-4">
      {[['Toplam', jobs.length], ['Kuyrukta', (statusCounts.QUEUED ?? 0) + (statusCounts.PENDING ?? 0)], ['İşleniyor', statusCounts.PROCESSING ?? 0], ['Başarısız', (statusCounts.FAILED ?? 0) + (statusCounts.MANUAL_REVIEW ?? 0)]].map(([label, value]) => <div className="panel bg-surface p-4" key={String(label)}><p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}
    </div>
    <section className="panel mt-5 overflow-hidden">
      <div className="border-b border-line px-5 py-4"><h2 className="font-semibold">Son dağıtım işleri</h2><p className="mt-1 text-sm text-muted">En yeni 50 iş gösteriliyor.</p></div>
      {jobs.length === 0 ? <div className="p-10 text-center"><p className="font-semibold">Dağıtım kuyruğu boş</p><p className="mt-2 text-sm text-muted">Onaylanan bir yayın dağıtıma gönderildiğinde işler burada görünecek.</p></div> : <div className="divide-y divide-line">
        {jobs.map((job) => <Link className="grid gap-2 p-5 text-sm transition-colors hover:bg-surface-strong md:grid-cols-[minmax(0,1fr)_0.6fr_0.7fr_0.4fr] md:items-center" href={`/admin/distribution/jobs/${job.id}`} key={job.id}><span className="min-w-0"><span className="block truncate font-semibold">{job.releaseTitle}</span><span className="text-xs text-muted">{new Date(job.createdAt).toLocaleString("tr-TR")}</span></span><span className="text-muted">{job.provider}</span><span className="rounded-full border border-line px-2 py-1 text-center text-xs font-semibold">{job.status}</span><span className="text-muted">{job.attemptCount}/{job.maxRetryCount}</span></Link>)}
      </div>}
    </section>
  </AdminShell>;
}
