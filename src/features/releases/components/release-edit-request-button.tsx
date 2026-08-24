"use client";

import { useState } from "react";

export function ReleaseEditRequestButton({ releaseId }: { releaseId: string }) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit() {
    setSending(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/releases/${releaseId}/request-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Talep gönderilemedi.");
      setStatus(result.message ?? "Talep admin ekibine iletildi.");
      setMessage("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Talep gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-accent/25 bg-accent/5 p-4">
      <p className="text-sm font-semibold">Yayın bilgisinde değişiklik mi gerekiyor?</p>
      <p className="mt-1 text-xs text-muted">Başlık, sanatçı veya dağıtım bilgisi için admin ekibine açıklama gönderin.</p>
      <textarea className="input mt-3 min-h-20" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Değişmesini istediğiniz alanı yazın…" />
      {status ? <p className="mt-2 text-xs text-muted" role="status">{status}</p> : null}
      <button className="button-primary mt-3" type="button" onClick={() => void submit()} disabled={sending}>{sending ? "Gönderiliyor…" : "Düzenleme talebi gönder"}</button>
    </div>
  );
}
