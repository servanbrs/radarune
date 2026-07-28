import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Network,
  RefreshCcw,
  Server,
  ShieldAlert,
  TimerReset,
  Webhook,
  Workflow,
  XCircle,
} from "lucide-react";

import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { ProcessNextJobButton } from "@/features/distribution-hub/components/process-next-job-button";
import { distributionJobService } from "@/features/distribution-hub/server/services/distribution-job.service";
import { distributionProviderConfigurationService } from "@/features/distribution-hub/server/services/provider-configuration.service";

const statusLabels: Record<string, string> = {
  PENDING: "Bekliyor",
  VALIDATING: "Doğrulanıyor",
  QUEUED: "Kuyrukta",
  PROCESSING: "İşleniyor",
  WAITING_PROVIDER: "Provider bekleniyor",
  RETRY_SCHEDULED: "Tekrar denenecek",
  SUCCEEDED: "Başarılı",
  PARTIALLY_SUCCEEDED: "Kısmen başarılı",
  FAILED: "Başarısız",
  CANCELLED: "İptal edildi",
  MANUAL_REVIEW: "Manuel inceleme",
};

const statusClasses: Record<string, string> = {
  PENDING: "border-slate-200 bg-slate-50 text-slate-700",
  VALIDATING: "border-violet-200 bg-violet-50 text-violet-700",
  QUEUED: "border-sky-200 bg-sky-50 text-sky-700",
  PROCESSING: "border-indigo-200 bg-indigo-50 text-indigo-700",
  WAITING_PROVIDER: "border-amber-200 bg-amber-50 text-amber-700",
  RETRY_SCHEDULED: "border-orange-200 bg-orange-50 text-orange-700",
  SUCCEEDED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PARTIALLY_SUCCEEDED: "border-cyan-200 bg-cyan-50 text-cyan-700",
  FAILED: "border-red-200 bg-red-50 text-red-700",
  CANCELLED: "border-zinc-200 bg-zinc-50 text-zinc-700",
  MANUAL_REVIEW: "border-rose-200 bg-rose-50 text-rose-700",
};

export default async function AdminDistributionPage() {
  const { organization, user } =
    await authSessionService.getDashboardContext();

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
    distributionProviderConfigurationService.listByOrganization(
      actor,
    ),
    distributionJobService.listJobs(actor),
  ]);

  const enabledProviders = providers.filter(
    (provider) => provider.isEnabled,
  );

  const configuredProviders = providers.filter(
    (provider) => provider.hasCredentials,
  );

  const queuedJobs = jobs.filter(
    (job) => job.status === "QUEUED",
  );

  const processingJobs = jobs.filter(
    (job) => job.status === "PROCESSING",
  );

  const retryJobs = jobs.filter(
    (job) => job.status === "RETRY_SCHEDULED",
  );

  const manualReviewJobs = jobs.filter(
    (job) => job.status === "MANUAL_REVIEW",
  );

  const failedJobs = jobs.filter(
    (job) => job.status === "FAILED",
  );

  const succeededJobs = jobs.filter(
    (job) => job.status === "SUCCEEDED",
  );

  const latestJobs = jobs.slice(0, 8);

  const requiresAttention =
    failedJobs.length > 0 ||
    manualReviewJobs.length > 0;

  return (
    <main className="page-shell">
      <div className="flex w-full flex-col gap-6">
        <section className="panel overflow-hidden">
          <div className="border-b border-line p-6 md:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                    Distribution Operations Center
                  </p>

                  <span
                    className={[
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                      requiresAttention
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700",
                    ].join(" ")}
                  >
                    <span className="size-2 rounded-full bg-current" />
                    {requiresAttention
                      ? "Müdahale gerekiyor"
                      : "Sistem sağlıklı"}
                  </span>
                </div>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                  Dağıtım operasyon merkezi
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                  Yayın kuyruğunu, provider bağlantılarını,
                  retry süreçlerini ve başarısız dağıtımları
                  tek merkezden yönetin.
                </p>
              </div>

              <ProcessNextJobButton />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:bg-black/5"
                href="/admin/distribution/jobs"
              >
                <Workflow className="size-4" />
                Joblar
              </Link>

              <Link
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:bg-black/5"
                href="/admin/distribution/providers"
              >
                <Network className="size-4" />
                Providerlar
              </Link>

              <Link
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:bg-black/5"
                href="/admin/distribution/webhooks"
              >
                <Webhook className="size-4" />
                Webhooklar
              </Link>

              <Link
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:bg-black/5"
                href="/admin/distribution/health"
              >
                <Activity className="size-4" />
                Sistem sağlığı
              </Link>

              <Link
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:bg-black/5"
                href="/admin/distribution/dead-letter"
              >
                <ShieldAlert className="size-4" />
                Dead letter
              </Link>
            </div>
          </div>

          <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            <div className="p-5 md:p-6">
              <Server className="size-5 text-indigo-600" />
              <p className="mt-4 text-3xl font-semibold">
                {enabledProviders.length}
              </p>
              <p className="mt-1 text-sm text-muted">
                Aktif provider
              </p>
            </div>

            <div className="p-5 md:p-6">
              <Workflow className="size-5 text-sky-600" />
              <p className="mt-4 text-3xl font-semibold">
                {jobs.length}
              </p>
              <p className="mt-1 text-sm text-muted">
                Toplam dağıtım işi
              </p>
            </div>

            <div className="p-5 md:p-6">
              <CheckCircle2 className="size-5 text-emerald-600" />
              <p className="mt-4 text-3xl font-semibold">
                {succeededJobs.length}
              </p>
              <p className="mt-1 text-sm text-muted">
                Başarıyla tamamlandı
              </p>
            </div>

            <div className="p-5 md:p-6">
              <ShieldAlert className="size-5 text-rose-600" />
              <p className="mt-4 text-3xl font-semibold">
                {manualReviewJobs.length}
              </p>
              <p className="mt-1 text-sm text-muted">
                Manuel inceleme
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <article className="panel p-5">
            <CircleDashed className="size-5 text-sky-600" />
            <p className="mt-4 text-2xl font-semibold">
              {queuedJobs.length}
            </p>
            <p className="mt-1 text-sm text-muted">
              Kuyrukta
            </p>
          </article>

          <article className="panel p-5">
            <RefreshCcw className="size-5 text-indigo-600" />
            <p className="mt-4 text-2xl font-semibold">
              {processingJobs.length}
            </p>
            <p className="mt-1 text-sm text-muted">
              İşleniyor
            </p>
          </article>

          <article className="panel p-5">
            <TimerReset className="size-5 text-orange-600" />
            <p className="mt-4 text-2xl font-semibold">
              {retryJobs.length}
            </p>
            <p className="mt-1 text-sm text-muted">
              Retry bekliyor
            </p>
          </article>

          <article className="panel p-5">
            <XCircle className="size-5 text-red-600" />
            <p className="mt-4 text-2xl font-semibold">
              {failedJobs.length}
            </p>
            <p className="mt-1 text-sm text-muted">
              Başarısız
            </p>
          </article>

          <article className="panel p-5">
            <ShieldAlert className="size-5 text-rose-600" />
            <p className="mt-4 text-2xl font-semibold">
              {manualReviewJobs.length}
            </p>
            <p className="mt-1 text-sm text-muted">
              İnceleme bekliyor
            </p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <article className="panel overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-line p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Queue Monitor
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  Son dağıtım işleri
                </h2>
              </div>

              <Link
                className="inline-flex items-center gap-2 text-sm font-semibold"
                href="/admin/distribution/jobs"
              >
                Tümünü gör
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {latestJobs.length > 0 ? (
              <div className="divide-y divide-line">
                {latestJobs.map((job) => (
                  <Link
                    className="grid gap-4 p-5 transition hover:bg-black/[0.025] md:grid-cols-[1.3fr_0.7fr_0.7fr_auto] md:items-center"
                    href={`/admin/distribution/jobs/${job.id}`}
                    key={job.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {job.releaseTitle}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted">
                        {job.releaseId} · v{job.releaseVersion}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        {job.provider}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Provider
                      </p>
                    </div>

                    <div>
                      <span
                        className={[
                          "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          statusClasses[job.status] ??
                            "border-line bg-white text-muted",
                        ].join(" ")}
                      >
                        {statusLabels[job.status] ??
                          job.status}
                      </span>
                    </div>

                    <div className="text-xs text-muted md:text-right">
                      {job.attemptCount}/{job.maxRetryCount}
                      <p className="mt-1">deneme</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <Workflow className="mx-auto size-8 text-muted" />
                <p className="mt-4 text-sm font-semibold">
                  Henüz dağıtım işi yok
                </p>
                <p className="mt-2 text-sm text-muted">
                  Kuyruğa alınan yayınlar burada görünecek.
                </p>
              </div>
            )}
          </article>

          <article className="panel p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Provider Health
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  Bağlantılar
                </h2>
              </div>

              <Network className="size-5 text-muted" />
            </div>

            <div className="mt-6 space-y-3">
              {providers.length > 0 ? (
                providers.map((provider) => {
                  const isReady =
                    provider.isEnabled &&
                    provider.hasCredentials;

                  return (
                    <div
                      className="rounded-2xl border border-line bg-white/60 p-4"
                      key={provider.id}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {provider.provider}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {provider.environment}
                          </p>
                        </div>

                        <span
                          className={[
                            "rounded-full border px-2.5 py-1 text-xs font-semibold",
                            isReady
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : provider.isEnabled
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-zinc-200 bg-zinc-50 text-zinc-600",
                          ].join(" ")}
                        >
                          {isReady
                            ? "Hazır"
                            : provider.isEnabled
                              ? "Eksik"
                              : "Pasif"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted">
                            Credential
                          </p>
                          <p className="mt-1 font-semibold">
                            {provider.hasCredentials
                              ? "Tanımlı"
                              : "Eksik"}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted">
                            Webhook
                          </p>
                          <p className="mt-1 font-semibold">
                            {provider.hasWebhookSecret
                              ? "Tanımlı"
                              : "Eksik"}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted">
                            Retry
                          </p>
                          <p className="mt-1 font-semibold">
                            {provider.maxRetryCount}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted">
                            Timeout
                          </p>
                          <p className="mt-1 font-semibold">
                            {provider.timeoutSeconds} sn
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="rounded-2xl border border-dashed border-line p-5 text-sm text-muted">
                  Provider yapılandırması bulunamadı.
                </p>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-5 text-center">
              <div>
                <p className="text-lg font-semibold">
                  {enabledProviders.length}
                </p>
                <p className="text-xs text-muted">
                  Aktif
                </p>
              </div>

              <div>
                <p className="text-lg font-semibold">
                  {configuredProviders.length}
                </p>
                <p className="text-xs text-muted">
                  Yetkili
                </p>
              </div>
            </div>
          </article>
        </section>

        {requiresAttention ? (
          <section className="panel border-amber-200 bg-amber-50/40 p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <AlertTriangle className="size-5" />
                </span>

                <div>
                  <h2 className="font-semibold">
                    Operasyon müdahalesi gerekiyor
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {failedJobs.length} başarısız ve{" "}
                    {manualReviewJobs.length} manuel inceleme
                    bekleyen dağıtım işi bulunuyor.
                  </p>
                </div>
              </div>

              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
                href="/admin/distribution/jobs"
              >
                Sorunlu işleri incele
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
