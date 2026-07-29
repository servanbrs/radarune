"use client";

import { useState } from "react";

type Provider = "Spotify" | "YouTube";

export function IntegrationStatusCard({
  provider,
  configured,
  missing,
}: {
  provider: Provider;
  configured: boolean;
  missing: string[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [isConfigured, setIsConfigured] = useState(configured);
  const [secretA, setSecretA] = useState("");
  const [secretB, setSecretB] = useState("");

  async function readResponse(response: Response) {
    const data = await response.json().catch(() => null);
    return data?.error ?? data?.message ?? null;
  }

  async function save() {
    const first = secretA.trim();
    const second = secretB.trim();
    if (!first || (provider === "Spotify" && !second)) {
      setMessage("Lütfen gerekli credential alanlarını doldurun.");
      return;
    }

    setPending(true);
    setMessage(null);
    try {
      const credentials = provider === "Spotify"
        ? { clientId: first, clientSecret: second }
        : { apiKey: first };
      const response = await fetch("/api/admin/integrations/credentials", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: provider.toUpperCase(), credentials }),
      });
      const error = await readResponse(response);
      if (response.ok) setIsConfigured(true);
      setMessage(response.ok ? "Credential şifreli olarak kaydedildi." : error ?? "Credential kaydedilemedi.");
    } catch {
      setMessage("Credential kaydı sırasında sunucuya ulaşılamadı.");
    } finally {
      setPending(false);
    }
  }

  async function test() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/integrations/${provider.toLowerCase()}`);
      const data = await response.json().catch(() => null);
      const error = data?.error ?? data?.message;
      if (response.ok && data?.success) setIsConfigured(true);
      setMessage(response.ok && data?.success
        ? `Bağlantı başarılı (${new Date(data.data.checkedAt).toLocaleString("tr-TR")})`
        : error ?? "Bağlantı testi başarısız.");
    } catch {
      setMessage("Bağlantı testi sırasında sunucuya ulaşılamadı.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Yapılandırma durumu</p>
          <p className={`mt-2 text-sm ${isConfigured ? "text-accent" : "text-danger"}`}>
            {isConfigured ? "Yapılandırıldı" : "Yapılandırılmadı"}
          </p>
        </div>
        <button className="rounded-full border border-line px-4 py-2 text-sm font-semibold disabled:opacity-50" disabled={pending} onClick={() => void test()} type="button">
          {pending ? "Test ediliyor…" : "Bağlantıyı test et"}
        </button>
      </div>
      {provider === "YouTube" ? (
        <p className="mt-4 rounded-xl border border-line bg-surface-strong p-3 text-xs text-muted">
          YouTube Data API v3 anahtarını kaydedin. Google Cloud kısıtlamasında sunucu istekleri için IP kısıtı veya kısıtlamasız kullanım seçin; yalnızca HTTP referrer kısıtı API_KEY_HTTP_REFERRER_BLOCKED hatası üretir.
        </p>
      ) : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <input className="rounded-xl border border-line bg-surface-strong px-3 py-2 text-sm" onChange={(event) => setSecretA(event.target.value)} placeholder={provider === "Spotify" ? "Client ID" : "YouTube API Key"} type="password" value={secretA} />
        {provider === "Spotify" ? <input className="rounded-xl border border-line bg-surface-strong px-3 py-2 text-sm" onChange={(event) => setSecretB(event.target.value)} placeholder="Client Secret" type="password" value={secretB} /> : null}
        <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground sm:col-span-2" disabled={pending || !secretA.trim() || (provider === "Spotify" && !secretB.trim())} onClick={() => void save()} type="button">
          Credential’ları kaydet
        </button>
      </div>
      {!isConfigured ? <p className="mt-4 text-xs text-muted">Eksik env alanları: {missing.join(", ") || "yok"}. Panel credential’ı şifreli olarak saklar.</p> : null}
      {message ? <p className="mt-4 rounded-xl border border-line p-3 text-sm" role="status">{message}</p> : null}
    </section>
  );
}
