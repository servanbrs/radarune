"use client";

import { useState } from "react";

export function AccountDeletionRequest() {
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function requestDeletion() {
    if (!window.confirm("Hesap silme talebi oluşturulsun mu? Bu işlem hesabınızı hemen silmez; destek ekibi sizinle iletişime geçer.")) return;
    setPending(true); setStatus(null);
    try {
      const response = await fetch("/api/account/deletion-requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason: "Kullanıcı hesabı silme talebi" }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Talep oluşturulamadı.");
      setStatus("Silme talebiniz alındı. Destek ekibimiz sizinle iletişime geçecek.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Talep oluşturulamadı."); }
    finally { setPending(false); }
  }

  return <div className="mt-4 flex flex-wrap items-center gap-3"><button className="rounded-full border border-danger/40 px-4 py-2 text-sm font-semibold text-danger" disabled={pending} onClick={requestDeletion} type="button">{pending ? "Gönderiliyor…" : "Hesap silme talebi"}</button><span aria-live="polite" className="text-xs text-muted">{status}</span></div>;
}
