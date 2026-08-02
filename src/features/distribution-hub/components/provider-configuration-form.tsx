"use client";

import { useMemo, useState } from "react";
import { distributionCapabilityKeys, distributionProviderKeys } from "@/features/distribution-hub/domain/provider";

type Provider = (typeof distributionProviderKeys)[number];
type Config = {
  provider: Provider; isEnabled: boolean; environment: "SANDBOX" | "PRODUCTION"; priority: number;
  maxRetryCount: number; timeoutSeconds: number; supportsAutoIsrc: boolean; supportsAutoUpc: boolean;
  supportsWebhooks: boolean; supportsUpdate: boolean; supportsTakedown: boolean; isDefault: boolean;
  hasCredentials: boolean; hasWebhookSecret: boolean; enabledCapabilities: string[];
  publicMetadata?: Record<string, string>;
};

const credentialFields: Record<Provider, string[]> = {
  ONE_RPM: ["apiKey", "accountId"], FUGA: ["apiKey", "apiSecret", "clientId"],
  SYMPHONIC: ["username", "password"], REVELATOR: ["apiKey", "accountToken"], INTERNAL: ["apiKey"],
};

export function ProviderConfigurationForm({ initial }: { initial: Config[] }) {
  const byProvider = useMemo(() => new Map(initial.map((item) => [item.provider, item])), [initial]);
  const [provider, setProvider] = useState<Provider>(initial[0]?.provider ?? "ONE_RPM");
  const current = byProvider.get(provider);
  const [isEnabled, setIsEnabled] = useState(current?.isEnabled ?? true);
  const [environment, setEnvironment] = useState<"SANDBOX" | "PRODUCTION">(current?.environment ?? "SANDBOX");
  const [priority, setPriority] = useState(current?.priority ?? 100);
  const [timeoutSeconds, setTimeoutSeconds] = useState(current?.timeoutSeconds ?? 60);
  const [maxRetryCount, setMaxRetryCount] = useState(current?.maxRetryCount ?? 3);
  const [oneRpmMode, setOneRpmMode] = useState<"MANUAL" | "AUTOMATION" | "API">(
    current?.publicMetadata?.mode === "AUTOMATION" || current?.publicMetadata?.mode === "API"
      ? current.publicMetadata.mode
      : "MANUAL",
  );
  const [webhookSecret, setWebhookSecret] = useState("");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [capabilities, setCapabilities] = useState<string[]>(current?.enabledCapabilities ?? ["CREATE_RELEASE", "STATUS_SYNC"]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(Boolean(current));

  function selectProvider(value: Provider) {
    const next = byProvider.get(value);
    setProvider(value); setIsEnabled(next?.isEnabled ?? true); setEnvironment(next?.environment ?? "SANDBOX");
    setPriority(next?.priority ?? 100); setTimeoutSeconds(next?.timeoutSeconds ?? 60); setMaxRetryCount(next?.maxRetryCount ?? 3);
    setOneRpmMode(next?.publicMetadata?.mode === "AUTOMATION" || next?.publicMetadata?.mode === "API" ? next.publicMetadata.mode : "MANUAL");
    setCapabilities(next?.enabledCapabilities ?? ["CREATE_RELEASE", "STATUS_SYNC"]); setCredentials({}); setWebhookSecret(""); setSaved(Boolean(next)); setMessage(null);
  }
  async function save() {
    setPending(true); setMessage(null);
    const response = await fetch("/api/distribution/providers", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider, isEnabled, environment, priority, timeoutSeconds, maxRetryCount, supportsAutoIsrc: capabilities.includes("AUTO_ISRC"), supportsAutoUpc: capabilities.includes("AUTO_UPC"), supportsWebhooks: capabilities.includes("WEBHOOKS"), supportsUpdate: capabilities.includes("UPDATE_RELEASE"), supportsTakedown: capabilities.includes("TAKEDOWN"), isDefault: false, credentials: Object.fromEntries(Object.entries(credentials).filter(([, value]) => value.trim())), ...(webhookSecret.trim() ? { webhookSecret: webhookSecret.trim() } : {}), publicMetadata: provider === "ONE_RPM" ? { mode: oneRpmMode } : {}, enabledCapabilities: capabilities }) });
    const data = await response.json().catch(() => null); setPending(false); setMessage(response.ok && data?.success ? "Provider ayarları kaydedildi." : data?.message ?? "Provider kaydedilemedi."); if (response.ok && data?.success) setSaved(true);
  }
  async function test() {
    setPending(true); setMessage(null); const response = await fetch(`/api/distribution/providers/${provider}/test`, { method: "POST" }); const data = await response.json().catch(() => null); setPending(false); setMessage(response.ok && data?.success ? "Bağlantı başarılı." : data?.message ?? "Bağlantı testi başarısız.");
  }
  return <section className="panel p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-muted">Dağıtım providerları</p><h2 className="mt-2 text-2xl font-semibold">Credential ve bağlantı merkezi</h2></div><select className="rounded-xl border border-line bg-surface-strong px-4 py-3 text-sm" value={provider} onChange={(event) => selectProvider(event.target.value as Provider)}>{distributionProviderKeys.map((key) => <option key={key} value={key}>{key}</option>)}</select></div>
    <div className="mt-6 grid gap-4 md:grid-cols-4"><label className="text-sm">Ortam<select className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-3 py-2" value={environment} onChange={(e) => setEnvironment(e.target.value as "SANDBOX" | "PRODUCTION")}><option>SANDBOX</option><option>PRODUCTION</option></select></label><label className="text-sm">Öncelik<input className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-3 py-2" type="number" min="1" max="1000" value={priority} onChange={(e) => setPriority(Number(e.target.value))}/></label><label className="flex items-center gap-3 pt-7 text-sm"><input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)}/> Provider aktif</label>{provider === "ONE_RPM" ? <label className="text-sm">ONErpm çalışma modu<select className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-3 py-2" value={oneRpmMode} onChange={(e) => setOneRpmMode(e.target.value as "MANUAL" | "AUTOMATION" | "API")}><option value="MANUAL">Manuel</option><option value="AUTOMATION">Oturum sonrası otomatik hazırlama</option><option value="API">Resmi API</option></select></label> : null}</div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">{credentialFields[provider].map((field) => <label className="text-sm" key={field}>{field}<input className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-3 py-2" type="password" placeholder={current?.hasCredentials ? "Kayıtlı değer korunur; değiştirmek için girin" : "Credential değerini girin"} value={credentials[field] ?? ""} onChange={(e) => setCredentials((old) => ({ ...old, [field]: e.target.value }))}/></label>)}<label className="text-sm md:col-span-2">Webhook secret (opsiyonel)<input className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-3 py-2" type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder={current?.hasWebhookSecret ? "Kayıtlı değer korunur" : "Webhook imza secret"}/></label></div>
    <div className="mt-5"><p className="text-sm font-semibold">Yetenekler</p><div className="mt-3 flex flex-wrap gap-2">{distributionCapabilityKeys.map((capability) => <label className="rounded-full border border-line px-3 py-2 text-xs" key={capability}><input className="mr-2" type="checkbox" checked={capabilities.includes(capability)} onChange={(e) => setCapabilities((old) => e.target.checked ? [...new Set([...old, capability])] : old.filter((item) => item !== capability))}/>{capability}</label>)}</div></div>
    <div className="mt-6 flex flex-wrap gap-3"><button className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground disabled:opacity-50" disabled={pending} onClick={() => void save()} type="button">{pending ? "Kaydediliyor…" : "Ayarları kaydet"}</button><button className="rounded-xl border border-line px-5 py-3 text-sm font-semibold disabled:opacity-50" disabled={pending || !saved} onClick={() => void test()} type="button">Bağlantıyı test et</button></div>{message ? <p className="mt-4 rounded-xl border border-line p-3 text-sm" role="status">{message}</p> : null}</section>;
}
