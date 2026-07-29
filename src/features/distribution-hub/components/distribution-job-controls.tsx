"use client";

import { useState } from "react";
import { distributionJobStatusKeys, distributionProviderKeys, type DistributionJobStatus, type DistributionProviderKey } from "@/features/distribution-hub/domain/provider";

type Config = { id: string; provider: DistributionProviderKey; environment: string; isEnabled: boolean };

export function DistributionJobControls({ jobId, initialStatus, initialProvider, initialConfigurationId, configurations }: { jobId: string; initialStatus: DistributionJobStatus; initialProvider: DistributionProviderKey; initialConfigurationId: string | null; configurations: Config[] }) {
  const [status, setStatus] = useState<DistributionJobStatus>(initialStatus);
  const [provider, setProvider] = useState<DistributionProviderKey>(initialProvider);
  const [configurationId, setConfigurationId] = useState(initialConfigurationId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const matching = configurations.filter((config) => config.provider === provider && config.isEnabled);
  async function save() {
    setPending(true); setMessage(null);
    const response = await fetch(`/api/distribution/jobs/${jobId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, provider, providerConfigurationId: configurationId || null }) });
    const data = await response.json().catch(() => null);
    setPending(false); setMessage(response.ok && data?.success ? "Job güncellendi." : data?.message ?? "Job güncellenemedi.");
  }
  return <section className="panel p-6"><h2 className="text-lg font-semibold">Job yönetimi</h2><p className="mt-1 text-sm text-muted">Durumu ve kullanılacak provider yapılandırmasını güncelleyin.</p><div className="mt-5 grid gap-4 md:grid-cols-3"><label className="text-sm">Durum<select className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value as DistributionJobStatus)}>{distributionJobStatusKeys.map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-sm">Provider<select className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-3 py-2" value={provider} onChange={(event) => { setProvider(event.target.value as DistributionProviderKey); setConfigurationId(""); }}>{distributionProviderKeys.map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-sm">Provider girişi<select className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-3 py-2" value={configurationId} onChange={(event) => setConfigurationId(event.target.value)}><option value="">Yapılandırma seçilmedi</option>{matching.map((config) => <option key={config.id} value={config.id}>{config.provider} · {config.environment}</option>)}</select></label></div><button className="mt-5 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground disabled:opacity-50" disabled={pending} onClick={() => void save()} type="button">{pending ? "Kaydediliyor…" : "Değişiklikleri kaydet"}</button>{message ? <p className="mt-3 rounded-xl border border-line p-3 text-sm" role="status">{message}</p> : null}</section>;
}
