"use client";

import { useState } from "react";
import type { FormEvent } from "react";

const eventOptions: Array<[string, string]> = [
  ["release.published", "Yayın yayına alındığında"],
  ["release.created", "Yeni yayın geldiğinde"],
  ["release.updated", "Yayın güncellendiğinde"],
  ["distribution.updated", "Dağıtım durumu değiştiğinde"],
  ["smart_link.created", "Smart Link oluşturulduğunda"],
];

export function WebhookEndpointForm() {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [events, setEvents] = useState(["release.published"]);
  const [message, setMessage] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setSecret(null);
    try {
      const response = await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, description: description || null, events }),
      });
      const data = (await response.json()) as { error?: string; secret?: string };
      if (!response.ok) throw new Error(data.error ?? "Webhook oluşturulamadı.");
      setMessage("Webhook kaydedildi. Gizli anahtar yalnızca şimdi gösterilir.");
      setSecret(data.secret ?? null);
      setUrl("");
      setDescription("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Webhook oluşturulamadı.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-5 grid gap-4 border-t border-line pt-5" onSubmit={submit}>
      <label className="grid gap-2 text-sm font-medium">HTTPS endpoint adresi<input className="rounded-xl border border-line bg-background px-4 py-3" placeholder="https://otomasyon.example.com/radarune" required type="url" value={url} onChange={(event) => setUrl(event.target.value)} /></label>
      <label className="grid gap-2 text-sm font-medium">Açıklama<input className="rounded-xl border border-line bg-background px-4 py-3" placeholder="Sosyal medya yayın otomasyonu" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <fieldset className="grid gap-2 text-sm"><legend className="font-medium">Gönderilecek olaylar</legend>{eventOptions.map(([value, label]) => <label className="flex items-center gap-2 text-muted" key={value}><input checked={events.includes(value)} onChange={(event) => setEvents((current) => event.target.checked ? [...new Set([...current, value])] : current.filter((item) => item !== value))} type="checkbox" />{label}</label>)}</fieldset>
      <button className="w-fit rounded-xl bg-accent px-5 py-3 font-semibold text-accent-foreground disabled:opacity-50" disabled={pending || !events.length} type="submit">{pending ? "Kaydediliyor…" : "Webhook oluştur"}</button>
      {message ? <p className="rounded-xl border border-line bg-surface-strong p-3 text-sm">{message}</p> : null}
      {secret ? <p className="break-all rounded-xl border border-amber-300/40 bg-amber-50 p-3 text-sm text-amber-900"><strong>Gizli anahtar:</strong> {secret}<br />Bu anahtarı şimdi güvenli biçimde kopyalayın; daha sonra tekrar gösterilmez.</p> : null}
    </form>
  );
}
