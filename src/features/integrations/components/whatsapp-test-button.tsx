"use client";

import { useState } from "react";

export function WhatsappTestButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function test() {
    setPending(true); setMessage(null);
    try {
      const response = await fetch("/api/admin/integrations/whatsapp/test", { method: "POST" });
      const data = await response.json() as { error?: string; recipient?: string };
      if (!response.ok) throw new Error(data.error ?? "Test mesajı gönderilemedi.");
      setMessage(`Test mesajı gönderildi: ${data.recipient}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Test mesajı gönderilemedi."); }
    finally { setPending(false); }
  }
  return <div className="flex flex-wrap items-center gap-3"><button className="rounded-xl border border-accent px-4 py-2.5 text-sm font-semibold text-accent disabled:opacity-50" disabled={pending} onClick={() => void test()} type="button">{pending ? "Gönderiliyor…" : "Test mesajı gönder"}</button>{message ? <span className="text-sm text-muted">{message}</span> : null}</div>;
}
