"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  distributionCapabilityKeys,
  distributionProviderKeys,
} from "@/features/distribution-hub/domain/provider";

type Provider = (typeof distributionProviderKeys)[number];
type OneRpmMode = "MANUAL" | "AUTOMATION";
type Config = {
  provider: Provider;
  isEnabled: boolean;
  environment: "SANDBOX" | "PRODUCTION";
  priority: number;
  maxRetryCount: number;
  timeoutSeconds: number;
  supportsAutoIsrc: boolean;
  supportsAutoUpc: boolean;
  supportsWebhooks: boolean;
  supportsUpdate: boolean;
  supportsTakedown: boolean;
  isDefault: boolean;
  hasCredentials: boolean;
  hasWebhookSecret: boolean;
  enabledCapabilities: string[];
  publicMetadata?: Record<string, string>;
};

type SessionStatus = {
  status: "NOT_CONNECTED" | "WAITING_LOGIN" | "WAITING_2FA" | "CONNECTED" | "EXPIRED" | "FAILED";
  connectedAt: string | null;
  lastCheckedAt: string | null;
  lastError: string | null;
};

const providerLabels: Record<Provider, string> = {
  ONE_RPM: "ONErpm",
  FUGA: "FUGA",
  SYMPHONIC: "Symphonic",
  REVELATOR: "Revelator",
  INTERNAL: "Radarune iç dağıtım",
};

const capabilityLabels: Record<string, string> = {
  CREATE_RELEASE: "Yayın oluşturma",
  UPDATE_RELEASE: "Yayın güncelleme",
  TAKEDOWN: "Yayından kaldırma",
  STATUS_SYNC: "Durum eşitleme",
  WEBHOOKS: "Webhook bildirimleri",
  ROYALTY_REPORTS: "Royalty raporları",
  AUTO_ISRC: "Otomatik ISRC",
  AUTO_UPC: "Otomatik UPC",
  CONTENT_ID: "Content ID",
  DOLBY_ATMOS: "Dolby Atmos",
  PRESAVE: "Pre-save",
};

const credentialFields: Record<Provider, string[]> = {
  ONE_RPM: [],
  FUGA: ["apiKey", "apiSecret", "clientId"],
  SYMPHONIC: ["username", "password"],
  REVELATOR: ["apiKey", "accountToken"],
  INTERNAL: ["apiKey"],
};

const credentialLabels: Record<string, string> = {
  apiKey: "API anahtarı",
  apiSecret: "API gizli anahtarı",
  clientId: "İstemci kimliği",
  username: "Kullanıcı adı",
  password: "Şifre",
  accountToken: "Hesap erişim anahtarı",
};

const sessionLabels: Record<SessionStatus["status"], string> = {
  NOT_CONNECTED: "Bağlı değil",
  WAITING_LOGIN: "Giriş bekleniyor",
  WAITING_2FA: "2FA bekleniyor",
  CONNECTED: "Bağlı",
  EXPIRED: "Oturum süresi doldu",
  FAILED: "Kontrol başarısız",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ProviderConfigurationForm({ initial }: { initial: Config[] }) {
  const byProvider = useMemo(
    () => new Map(initial.map((item) => [item.provider, item])),
    [initial],
  );
  const [provider, setProvider] = useState<Provider>(initial[0]?.provider ?? "ONE_RPM");
  const current = byProvider.get(provider);
  const [isEnabled, setIsEnabled] = useState(current?.isEnabled ?? true);
  const [environment, setEnvironment] = useState<"SANDBOX" | "PRODUCTION">(
    current?.environment ?? "SANDBOX",
  );
  const [priority, setPriority] = useState(current?.priority ?? 100);
  const [timeoutSeconds, setTimeoutSeconds] = useState(current?.timeoutSeconds ?? 60);
  const [maxRetryCount, setMaxRetryCount] = useState(current?.maxRetryCount ?? 3);
  const [oneRpmMode, setOneRpmMode] = useState<OneRpmMode>(
    current?.publicMetadata?.mode === "AUTOMATION" ? "AUTOMATION" : "MANUAL",
  );
  const [webhookSecret, setWebhookSecret] = useState("");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [capabilities, setCapabilities] = useState<string[]>(
    current?.enabledCapabilities ?? ["CREATE_RELEASE", "STATUS_SYNC"],
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(Boolean(current));
  const [session, setSession] = useState<SessionStatus | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  async function loadSessionStatus() {
    setSessionLoading(true);
    try {
      const response = await fetch("/api/distribution/onerpm/session", {
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) setSession(data.data);
    } finally {
      setSessionLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSessionStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function selectProvider(value: Provider) {
    const next = byProvider.get(value);
    setProvider(value);
    setIsEnabled(next?.isEnabled ?? true);
    setEnvironment(next?.environment ?? "SANDBOX");
    setPriority(next?.priority ?? 100);
    setTimeoutSeconds(next?.timeoutSeconds ?? 60);
    setMaxRetryCount(next?.maxRetryCount ?? 3);
    setOneRpmMode(next?.publicMetadata?.mode === "AUTOMATION" ? "AUTOMATION" : "MANUAL");
    setCapabilities(next?.enabledCapabilities ?? ["CREATE_RELEASE", "STATUS_SYNC"]);
    setCredentials({});
    setWebhookSecret("");
    setSaved(Boolean(next));
    setMessage(null);
  }

  async function save() {
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/distribution/providers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        provider,
        isEnabled,
        environment,
        priority,
        timeoutSeconds,
        maxRetryCount,
        supportsAutoIsrc: capabilities.includes("AUTO_ISRC"),
        supportsAutoUpc: capabilities.includes("AUTO_UPC"),
        supportsWebhooks: capabilities.includes("WEBHOOKS"),
        supportsUpdate: capabilities.includes("UPDATE_RELEASE"),
        supportsTakedown: capabilities.includes("TAKEDOWN"),
        isDefault: false,
        credentials: Object.fromEntries(
          Object.entries(credentials).filter(([, value]) => value.trim()),
        ),
        ...(webhookSecret.trim() ? { webhookSecret: webhookSecret.trim() } : {}),
        publicMetadata: provider === "ONE_RPM" ? { mode: oneRpmMode } : {},
        enabledCapabilities: capabilities,
      }),
    });
    const data = await response.json().catch(() => null);
    setPending(false);
    setMessage(
      response.ok && data?.success
        ? "Dağıtım ayarları kaydedildi."
        : data?.message ?? "Dağıtım ayarları kaydedilemedi.",
    );
    if (response.ok && data?.success) setSaved(true);
  }

  async function test() {
    setPending(true);
    setMessage(null);
    const response = await fetch(`/api/distribution/providers/${provider}/test`, {
      method: "POST",
    });
    const data = await response.json().catch(() => null);
    setPending(false);
    setMessage(
      response.ok && data?.success
        ? "Bağlantı başarılı."
        : data?.message ?? "Bağlantı testi başarısız.",
    );
    if (provider === "ONE_RPM") void loadSessionStatus();
  }

  const oneRpmAutomation = provider === "ONE_RPM" && oneRpmMode === "AUTOMATION";
  const sessionConnected = session?.status === "CONNECTED";

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Dağıtım bağlantıları</p>
          <h2 className="mt-2 text-2xl font-semibold">Yayın gönderim ayarları</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Yayın onayından sonra hangi servise gönderileceğini ve bağlantının nasıl çalışacağını seçin.
          </p>
        </div>
        <label className="text-sm">
          Servis
          <select className="mt-2 rounded-xl border border-line bg-surface-strong px-4 py-3 text-sm" value={provider} onChange={(event) => selectProvider(event.target.value as Provider)}>
            {distributionProviderKeys.map((key) => <option key={key} value={key}>{providerLabels[key]}</option>)}
          </select>
        </label>
      </div>

      {provider === "ONE_RPM" ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-line bg-surface-strong p-5">
            <p className="text-sm font-semibold">ONErpm bağlantı yöntemi</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              ONErpm şifreniz ve 2FA kodunuz Radarune’e girilmez, kaydedilmez ve okunmaz.
              Açılan güvenli tarayıcıda siz giriş yaparsınız; sistem yalnızca yetkilendirilmiş oturumu kullanır.
            </p>
            <label className="mt-4 block text-sm">
              Çalışma şekli
              <select className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2" value={oneRpmMode} onChange={(event) => setOneRpmMode(event.target.value as OneRpmMode)}>
                <option value="MANUAL">Her yayını panelden ben hazırlayacağım</option>
                <option value="AUTOMATION">Onaydan sonra formu otomatik doldur</option>
              </select>
            </label>
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm leading-6 text-muted">
              Otomatik seçenek ONErpm’de son gönderimi yapmaz. Kapak, ses dosyaları, sanatçılar,
              mağazalar, UPC ve mevcut ISRC bilgilerini forma taşır; siz kontrol edip ONErpm içinden gönderirsiniz.
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface-strong p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">ONErpm oturum durumu</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sessionConnected ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"}`}>
                {session ? sessionLabels[session.status] : "Kontrol ediliyor"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">
              ONErpm hesabınıza giriş ve 2FA işlemi yalnızca ONErpm’in kendi sayfasında yapılır.
              Radarune, tarayıcıdaki ONErpm çerezlerini okuyamaz veya bu oturumu sunucuya kopyalayamaz.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
                href="https://dashboard.onerpm.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                ONErpm panelini aç ↗
              </a>
              <Link
                className="rounded-xl border border-line px-4 py-2 text-sm font-semibold"
                href="/admin/import-sources"
              >
                Katalog aktarımına git
              </Link>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              Panelde giriş yaptıktan sonra ONErpm’den aldığınız katalog dışa aktarma dosyasını
              içe aktarma ekranından yükleyebilirsiniz. Bu yöntem şifre ve 2FA kodunu Radarune’e taşımaz.
            </p>
            <dl className="mt-4 grid gap-2 text-xs text-muted">
              <div className="flex justify-between gap-3"><dt>Son bağlantı</dt><dd>{formatDate(session?.connectedAt ?? null)}</dd></div>
              <div className="flex justify-between gap-3"><dt>Son kontrol</dt><dd>{formatDate(session?.lastCheckedAt ?? null)}</dd></div>
            </dl>
            {session?.lastError ? <p className="mt-3 text-xs text-red-700">{session.lastError}</p> : null}
            <button className="mt-4 rounded-xl border border-line px-4 py-2 text-sm font-semibold disabled:opacity-50" type="button" disabled={sessionLoading} onClick={() => void loadSessionStatus()}>
              {sessionLoading ? "Kontrol ediliyor…" : "Sunucu otomasyon oturumunu kontrol et"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <label className="text-sm">Ortam<select className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-3 py-2" value={environment} onChange={(event) => setEnvironment(event.target.value as "SANDBOX" | "PRODUCTION")}><option value="SANDBOX">Test ortamı</option><option value="PRODUCTION">Canlı ortam</option></select></label>
        <label className="text-sm">Öncelik<input className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-3 py-2" type="number" min="1" max="1000" value={priority} onChange={(event) => setPriority(Number(event.target.value))} /></label>
        <label className="flex items-center gap-3 pt-7 text-sm"><input type="checkbox" checked={isEnabled} onChange={(event) => setIsEnabled(event.target.checked)} /> Bağlantı aktif</label>
        <label className="text-sm">Yeniden deneme süresi (sn)<input className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-3 py-2" type="number" min="5" max="300" value={timeoutSeconds} onChange={(event) => setTimeoutSeconds(Number(event.target.value))} /></label>
      </div>

      {credentialFields[provider].length > 0 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {credentialFields[provider].map((field) => (
            <label className="text-sm" key={field}>
              {credentialLabels[field] ?? field}
              <input className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-3 py-2" type="password" placeholder={current?.hasCredentials ? "Kayıtlı değer korunur; değiştirmek için girin" : "Değeri girin"} value={credentials[field] ?? ""} onChange={(event) => setCredentials((old) => ({ ...old, [field]: event.target.value }))} />
            </label>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm">Webhook imza anahtarı (opsiyonel)<input className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-3 py-2" type="password" value={webhookSecret} onChange={(event) => setWebhookSecret(event.target.value)} placeholder={current?.hasWebhookSecret ? "Kayıtlı değer korunur" : "Yalnızca sağlayıcı webhook kullanıyorsa girin"} /></label>
        <label className="flex items-center gap-3 pt-7 text-sm"><input type="checkbox" checked={capabilities.includes("AUTO_ISRC")} onChange={(event) => setCapabilities((old) => event.target.checked ? [...new Set([...old, "AUTO_ISRC"])] : old.filter((item) => item !== "AUTO_ISRC"))} /> Sağlayıcının ISRC üretmesine izin ver</label>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold">Kullanılacak özellikler</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {distributionCapabilityKeys.map((capability) => (
            <label className="rounded-full border border-line px-3 py-2 text-xs" key={capability}>
              <input className="mr-2" type="checkbox" checked={capabilities.includes(capability)} onChange={(event) => setCapabilities((old) => event.target.checked ? [...new Set([...old, capability])] : old.filter((item) => item !== capability))} />
              {capabilityLabels[capability] ?? capability}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground disabled:opacity-50" disabled={pending} onClick={() => void save()} type="button">{pending ? "Kaydediliyor…" : "Ayarları kaydet"}</button>
        <button className="rounded-xl border border-line px-5 py-3 text-sm font-semibold disabled:opacity-50" disabled={pending || !saved} onClick={() => void test()} type="button">Bağlantıyı test et</button>
      </div>
      {oneRpmAutomation ? <p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-muted">Akış: Yayın onayı → ONErpm formunu doldur → senin son kontrolün ve gönderimin → UPC/ISRC bilgilerini Radarune’e geri eşleştir.</p> : null}
      {message ? <p className="mt-4 rounded-xl border border-line p-3 text-sm" role="status">{message}</p> : null}
    </section>
  );
}
