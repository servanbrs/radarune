import { notFound } from "next/navigation";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { adminDistributionService } from "@/features/distribution-hub/server/services/admin-distribution.service";

type AdminDistributionJobDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminDistributionJobDetailPage({
  params,
}: AdminDistributionJobDetailPageProps) {
  const { id } = await params;
  const { organization, user } = await authSessionService.getDashboardContext();
  rbacService.redirectIfMissingEffectivePermission({
    membershipRole: organization.role,
    permission: "distribution:view",
    systemRole: user.systemRole,
  });

  const job = await adminDistributionService.getJob(
    {
      organizationId: organization.organization.id,
      membershipRole: organization.role,
      systemRole: user.systemRole,
      userId: user.id,
    },
    id,
  );

  if (!job) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Job detayı</p>
        <h1 className="mt-3 text-3xl font-semibold">{job.releaseTitle}</h1>
        <p className="mt-3 text-sm text-muted">
          {job.provider} · {job.status} · Deneme {job.attemptCount}/{job.maxRetryCount}
        </p>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <article className="panel p-6">
          <h2 className="text-lg font-semibold">İşlem bilgisi</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <Detail label="Release ID" value={job.releaseId} />
            <Detail label="Idempotency key" value={job.idempotencyKey} />
            <Detail label="Payload hash" value={job.payloadHash} />
            <Detail label="Son hata" value={job.lastErrorMessage ?? "Yok"} />
          </dl>
        </article>
        <article className="panel p-6">
          <h2 className="text-lg font-semibold">Provider yapılandırması</h2>
          <p className="mt-4 text-sm text-muted">
            Credential secret değerleri güvenlik nedeniyle bu ekranda gösterilmez.
          </p>
          <p className="mt-3 text-sm">
            Environment: {job.providerConfiguration?.environment ?? "Tanımsız"}
          </p>
        </article>
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-muted">{label}</dt>
      <dd className="mt-1 break-all font-medium">{value}</dd>
    </div>
  );
}
