import { notFound } from "next/navigation";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { adminDistributionService } from "@/features/distribution-hub/server/services/admin-distribution.service";
import { distributionProviderConfigurationRepository } from "@/features/distribution-hub/server/repositories/provider-configuration.repository";
import { DistributionJobControls } from "@/features/distribution-hub/components/distribution-job-controls";
import { AdminShell } from "@/features/admin/components/admin-shell";

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
  const configurations = await distributionProviderConfigurationRepository.listByOrganizationId(organization.organization.id);

  if (!job) {
    notFound();
  }

  return (
    <AdminShell title={job.releaseTitle} description="Dağıtım job durumunu, provider yapılandırmasını ve güvenli işlem kontrollerini inceleyin.">
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
      {job.provider === "ONE_RPM" && job.status === "MANUAL_REVIEW" ? (
        <section className="panel border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">ONErpm manuel son kontrol</p>
          <h2 className="mt-2 text-xl font-semibold">Form ve dosya hazırlığı tamamlandığında burada görünür</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6">
            Sistem ONErpm oturumunuzla başlık, sanatçı, kapak, ses dosyası ve UPC/ISRC alanlarını doldurur. Bu adım son gönderim değildir; ONErpm’de son kontrolü yapıp gönderimi siz onaylamalısınız.
          </p>
          <a
            className="mt-4 inline-flex rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
            href={`/api/distribution/jobs/${job.id}/onerpm-preview`}
            target="_blank"
            rel="noreferrer"
          >
            ONErpm form önizlemesini aç
          </a>
        </section>
      ) : null}
      <DistributionJobControls
        jobId={job.id}
        initialStatus={job.status}
        initialProvider={job.provider}
        initialConfigurationId={job.providerConfigurationId}
        configurations={configurations.map((config) => ({ id: config.id, provider: config.provider, environment: config.environment, isEnabled: config.isEnabled }))}
      />
    </AdminShell>
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
