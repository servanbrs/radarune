import Link from "next/link";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { distributionJobService } from "@/features/distribution-hub/server/services/distribution-job.service";
import { distributionProviderConfigurationService } from "@/features/distribution-hub/server/services/provider-configuration.service";

export default async function AdminDistributionPage() {
  const { organization, user } = await authSessionService.getDashboardContext();

  rbacService.redirectIfMissingEffectivePermission({
    membershipRole: organization.role,
    permission: "distribution:view",
    systemRole: user.systemRole,
  });

  const actor = {
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  } as const;

  const [providers, jobs] = await Promise.all([
    distributionProviderConfigurationService.listByOrganization(actor),
    distributionJobService.listJobs(actor),
  ]);

  return (
    <main className="page-shell">
      <div className="flex w-full flex-col gap-6">
        <section className="panel p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">
            Distribution Hub
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Admin Distribution Center</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            Bu merkez, Sprint 2 Release Management modülünde onaylanan yayınları
            canonical payload olarak kuyruğa alır, provider adapter üzerinden işler ve
            delivery durumlarını release statüsüyle senkronize eder.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
            <Link className="rounded-full border border-line bg-white px-4 py-2" href="/admin/distribution/providers">
              Providerlar
            </Link>
            <Link className="rounded-full border border-line bg-white px-4 py-2" href="/admin/distribution/jobs">
              Joblar
            </Link>
            <Link className="rounded-full border border-line bg-white px-4 py-2" href="/admin/distribution/webhooks">
              Webhooklar
            </Link>
            <Link className="rounded-full border border-line bg-white px-4 py-2" href="/admin/distribution/health">
              Health
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-4">
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Aktif provider
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {providers.filter((provider) => provider.isEnabled).length}
            </p>
          </article>
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Queued jobs</p>
            <p className="mt-3 text-2xl font-semibold">
              {jobs.filter((job) => job.status === "QUEUED").length}
            </p>
          </article>
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Manual review
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {jobs.filter((job) => job.status === "MANUAL_REVIEW").length}
            </p>
          </article>
          <article className="panel p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Succeeded
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {jobs.filter((job) => job.status === "SUCCEEDED").length}
            </p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="panel p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Provider konfigürasyonları
            </p>
            <div className="mt-6 space-y-3">
              {providers.map((provider) => (
                <div className="rounded-2xl border bg-white/70 px-4 py-4" key={provider.id}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium">{provider.provider}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted">
                      {provider.isEnabled ? provider.environment : "PASIF"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    Retry: {provider.maxRetryCount} · Timeout: {provider.timeoutSeconds}s ·
                    Varsayılan: {provider.isDefault ? "Evet" : "Hayır"}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Credential: {provider.hasCredentials ? "Tanımlı" : "Tanımsız"} ·
                    Webhook: {provider.hasWebhookSecret ? "Tanımlı" : "Tanımsız"}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Job kuyruğu
            </p>
            <div className="mt-6 space-y-3">
              {jobs.map((job) => (
                <div className="rounded-2xl border bg-white/70 px-4 py-4" key={job.id}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium">
                      {job.releaseTitle} · {job.provider}
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted">
                      {job.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    Release ID: {job.releaseId} · Versiyon: {job.releaseVersion}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Deneme: {job.attemptCount}/{job.maxRetryCount}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
