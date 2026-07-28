import {
  CheckCircle2,
  CircleAlert,
  Database,
  FileAudio,
  FileImage,
  Files,
  FolderOpen,
  HardDrive,
  Server,
} from "lucide-react";

import {
  setDefaultStorageProviderAction,
  testStorageProviderAction,
  toggleStorageProviderAction,
} from "@/features/admin/storage/server/actions/admin-storage.actions";

type StorageDashboardData = Awaited<
  ReturnType<
    typeof import("@/features/admin/storage/server/services/admin-storage.service").adminStorageService.getDashboard
  >
>;

type AdminStorageDashboardProps = {
  data: StorageDashboardData;
};

const numberFormatter = new Intl.NumberFormat("tr-TR");

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const providerTypeLabels: Record<string, string> = {
  LOCAL: "Local Storage",
  S3: "Amazon S3",
  S3_COMPATIBLE: "S3 Compatible",
  CLOUDFLARE_R2: "Cloudflare R2",
  DIGITALOCEAN_SPACES: "DigitalOcean Spaces",
  MINIO: "MinIO",
  SUPABASE_STORAGE: "Supabase Storage",
  AZURE_BLOB: "Azure Blob",
  GOOGLE_CLOUD_STORAGE: "Google Cloud Storage",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Hazır",
  INACTIVE: "Pasif",
  CONFIGURATION_REQUIRED: "Yapılandırma gerekli",
  FAILED: "Hata",
};

function formatBytes(value: bigint) {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const amount = bytes / 1024 ** index;

  return `${new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: index === 0 ? 0 : 1,
  }).format(amount)} ${units[index]}`;
}

function getStatusClasses(status: string) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-700/20 bg-emerald-600/10 text-emerald-700";

    case "FAILED":
      return "border-red-700/20 bg-red-600/10 text-red-700";

    case "CONFIGURATION_REQUIRED":
      return "border-amber-700/20 bg-amber-500/10 text-amber-700";

    default:
      return "border-line bg-surface-strong text-muted";
  }
}

function OverviewCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Files;
  label: string;
  value: string;
}) {
  return (
    <article className="panel p-5">
      <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon className="size-5" />
      </div>

      <p className="mt-5 text-sm text-muted">{label}</p>

      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </article>
  );
}

export function AdminStorageDashboard({
  data,
}: AdminStorageDashboardProps) {
  return (
    <div className="grid gap-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          icon={Files}
          label="Toplam dosya"
          value={numberFormatter.format(
            data.overview.totalUploads,
          )}
        />

        <OverviewCard
          icon={HardDrive}
          label="Toplam kullanım"
          value={formatBytes(data.overview.totalBytes)}
        />

        <OverviewCard
          icon={FileAudio}
          label="Ses dosyaları"
          value={numberFormatter.format(
            data.overview.audioUploads,
          )}
        />

        <OverviewCard
          icon={FileImage}
          label="Kapak görselleri"
          value={numberFormatter.format(
            data.overview.artworkUploads,
          )}
        />
      </section>

      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-5 sm:p-6">
          <div>
            <h2 className="font-semibold text-foreground">
              Storage providerları
            </h2>

            <p className="mt-1 text-sm text-muted">
              Dosyaların saklandığı servisleri yönetin.
            </p>
          </div>

          <span className="rounded-full border border-line bg-surface-strong px-3 py-1.5 text-xs font-semibold text-muted">
            {numberFormatter.format(data.providers.length)}{" "}
            provider
          </span>
        </div>

        {data.providers.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-surface-strong text-muted">
              <Database className="size-5" />
            </div>

            <p className="mt-4 text-sm font-semibold text-foreground">
              Storage provider bulunmuyor
            </p>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted">
              Aşağıdaki formdan ilk Local Storage
              providerınızı oluşturun.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {data.providers.map((provider) => (
              <article
                className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center"
                key={provider.id}
              >
                <div className="flex min-w-0 gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    {provider.type === "LOCAL" ? (
                      <FolderOpen className="size-5" />
                    ) : (
                      <Server className="size-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {provider.name}
                      </h3>

                      {provider.isDefault ? (
                        <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
                          Varsayılan
                        </span>
                      ) : null}

                      {provider.active ? (
                        <span className="rounded-full border border-emerald-700/20 bg-emerald-600/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          Aktif
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 text-sm text-muted">
                      {providerTypeLabels[provider.type] ??
                        provider.type}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
                      <span>
                        Dosya:{" "}
                        <strong className="font-semibold text-foreground">
                          {numberFormatter.format(
                            provider.usage.fileCount,
                          )}
                        </strong>
                      </span>

                      <span>
                        Kullanım:{" "}
                        <strong className="font-semibold text-foreground">
                          {formatBytes(
                            provider.usage.totalBytes,
                          )}
                        </strong>
                      </span>

                      {provider.maxFileSizeBytes ? (
                        <span>
                          Dosya limiti:{" "}
                          <strong className="font-semibold text-foreground">
                            {formatBytes(
                              provider.maxFileSizeBytes,
                            )}
                          </strong>
                        </span>
                      ) : null}
                    </div>

                    {provider.localBasePath ? (
                      <p className="mt-3 break-all rounded-xl bg-surface-strong px-3 py-2 font-mono text-xs text-muted">
                        {provider.localBasePath}
                      </p>
                    ) : null}

                    {provider.lastError ? (
                      <div className="mt-3 flex gap-2 rounded-xl border border-red-700/15 bg-red-600/5 p-3 text-xs text-red-700">
                        <CircleAlert className="mt-0.5 size-4 shrink-0" />
                        <span>{provider.lastError}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                      provider.status,
                    )}`}
                  >
                    {provider.status === "ACTIVE" ? (
                      <CheckCircle2 className="mr-1.5 inline size-3.5" />
                    ) : null}

                    {statusLabels[provider.status] ??
                      provider.status}
                  </span>

                  <form
                    action={testStorageProviderAction}
                  >
                    <input
                      name="providerId"
                      type="hidden"
                      value={provider.id}
                    />

                    <button
                      className="h-9 rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-foreground transition hover:bg-surface-strong"
                      type="submit"
                    >
                      Bağlantıyı test et
                    </button>
                  </form>

                  {!provider.isDefault ? (
                    <form
                      action={
                        setDefaultStorageProviderAction
                      }
                    >
                      <input
                        name="providerId"
                        type="hidden"
                        value={provider.id}
                      />

                      <button
                        className="h-9 rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-foreground transition hover:bg-surface-strong"
                        type="submit"
                      >
                        Varsayılan yap
                      </button>
                    </form>
                  ) : null}

                  <form
                    action={toggleStorageProviderAction}
                  >
                    <input
                      name="providerId"
                      type="hidden"
                      value={provider.id}
                    />

                    <button
                      className="h-9 rounded-xl bg-foreground px-3 text-xs font-semibold text-background transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={
                        !provider.active &&
                        provider.status !== "ACTIVE"
                      }
                      type="submit"
                    >
                      {provider.active
                        ? "Pasif yap"
                        : "Aktif yap"}
                    </button>
                  </form>
                </div>

                {provider.lastCheckedAt ? (
                  <p className="text-xs text-muted xl:col-span-2">
                    Son kontrol:{" "}
                    {dateFormatter.format(
                      provider.lastCheckedAt,
                    )}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="panel p-5 sm:p-6">
          <h2 className="font-semibold text-foreground">
            Upload durumu
          </h2>

          <p className="mt-1 text-sm text-muted">
            Sistemdeki dosya işlemlerinin mevcut dağılımı.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-line bg-surface-strong/50 p-4">
              <p className="text-xs text-muted">Hazır</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {numberFormatter.format(
                  data.overview.readyUploads,
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface-strong/50 p-4">
              <p className="text-xs text-muted">
                İşleniyor
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {numberFormatter.format(
                  data.overview.pendingUploads,
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface-strong/50 p-4">
              <p className="text-xs text-muted">Başarısız</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {numberFormatter.format(
                  data.overview.failedUploads,
                )}
              </p>
            </div>
          </div>
        </article>

        <article className="panel p-5 sm:p-6">
          <h2 className="font-semibold text-foreground">
            Storage sağlığı
          </h2>

          <p className="mt-1 text-sm text-muted">
            Provider durumlarının kısa özeti.
          </p>

          <div className="mt-6 grid gap-3">
            <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
              <span className="text-sm text-muted">
                Hazır provider
              </span>

              <strong className="text-sm text-foreground">
                {
                  data.providers.filter(
                    (provider) =>
                      provider.status === "ACTIVE",
                  ).length
                }
              </strong>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
              <span className="text-sm text-muted">
                Aktif provider
              </span>

              <strong className="text-sm text-foreground">
                {
                  data.providers.filter(
                    (provider) => provider.active,
                  ).length
                }
              </strong>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
              <span className="text-sm text-muted">
                Hatalı provider
              </span>

              <strong className="text-sm text-foreground">
                {
                  data.providers.filter(
                    (provider) =>
                      provider.status === "FAILED",
                  ).length
                }
              </strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
