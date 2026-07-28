"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Provider = "STRIPE" | "IYZICO" | "PAYTR" | "MANUAL_BANK_TRANSFER";

export function PaymentProviderSettingsForm({ initial }: { initial: Array<{ provider: Provider; active: boolean; displayName: string | null; hasCredentials: boolean; hasWebhookSecret: boolean }> }) {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider>(initial[0]?.provider ?? "MANUAL_BANK_TRANSFER");
  const current = initial.find((item) => item.provider === provider);
  const [active, setActive] = useState(current?.active ?? false);
  const [displayName, setDisplayName] = useState(current?.displayName ?? "");
  const [secret, setSecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function selectProvider(value: Provider) {
    const next = initial.find((item) => item.provider === value);
    setProvider(value); setActive(next?.active ?? false); setDisplayName(next?.displayName ?? ""); setSecret(""); setWebhookSecret("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setMessage(null);
    try {
      const credentials = secret ? { secret } : {};
      const response = await fetch("/api/billing/provider-configs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ provider, active, displayName, credentials, ...(webhookSecret ? { webhookSecret } : {}) }) });
      const payload = (await response.json()) as { message?: string; error?: string; success?: boolean };
      if (!response.ok || payload.success === false) throw new Error(payload.message ?? payload.error ?? "Provider ayarı kaydedilemedi.");
      setSecret(""); setWebhookSecret(""); setMessage("Provider ayarı kaydedildi. Gerçek ödeme gönderimi için provider doğrulaması ayrıca gereklidir."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Provider ayarı kaydedilemedi."); }
    finally { setPending(false); }
  }

  return <form className="grid gap-4" onSubmit={save}><label className="grid gap-2 text-sm font-medium">Provider<select className="h-12 rounded-xl border border-line bg-white px-4" value={provider} onChange={(event) => selectProvider(event.target.value as Provider)}><option value="MANUAL_BANK_TRANSFER">Manuel banka transferi</option><option value="STRIPE">Stripe Connect</option><option value="IYZICO">iyzico</option><option value="PAYTR">PayTR</option></select></label><label className="flex items-center gap-3 text-sm font-medium"><input checked={active} onChange={(event) => setActive(event.target.checked)} type="checkbox" /> Provider aktif</label><label className="grid gap-2 text-sm font-medium">Görünen ad<input className="rounded-xl border border-line bg-white px-4 py-3" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label><label className="grid gap-2 text-sm font-medium">Credential / secret<input className="rounded-xl border border-line bg-white px-4 py-3" placeholder={current?.hasCredentials ? "Mevcut credential’ı değiştirmek için girin" : "Credential girin"} type="password" value={secret} onChange={(event) => setSecret(event.target.value)} /></label><label className="grid gap-2 text-sm font-medium">Webhook secret<input className="rounded-xl border border-line bg-white px-4 py-3" placeholder={current?.hasWebhookSecret ? "Mevcut secret’ı değiştirmek için girin" : "Webhook secret"} type="password" value={webhookSecret} onChange={(event) => setWebhookSecret(event.target.value)} /></label><button className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? "Kaydediliyor…" : "Provider ayarını kaydet"}</button>{message ? <p className="rounded-xl border border-line p-3 text-sm">{message}</p> : null}</form>;
}
