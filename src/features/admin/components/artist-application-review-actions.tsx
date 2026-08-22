"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Action = "START_REVIEW" | "APPROVE" | "REJECT" | "REQUEST_REVISION";

export function ArtistApplicationReviewActions({
  applicationId,
  status,
}: {
  applicationId: string;
  status: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: Action) {
    if ((action === "REJECT" || action === "REQUEST_REVISION") && !reason.trim()) {
      setMessage(action === "REQUEST_REVISION" ? "Eksik belge veya revizyon açıklamasını yazın." : "Red nedenini yazın.");
      return;
    }
    if (action === "APPROVE" && !verificationConfirmed) {
      setMessage("Onaylamak için doğrulama kanıtını manuel olarak kontrol ettiğinizi onaylayın.");
      return;
    }

    startTransition(async () => {
      setMessage(null);
      const response = await fetch(`/api/admin/applications/${applicationId}/action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, reason: reason.trim() || undefined, verificationConfirmed }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.error ?? "Başvuru işlemi tamamlanamadı.");
        return;
      }
      setMessage(action === "APPROVE" ? "Başvuru onaylandı." : action === "REJECT" ? "Başvuru reddedildi." : action === "REQUEST_REVISION" ? "Eksik belge/revizyon talebi gönderildi." : "Başvuru incelemeye alındı.");
      router.refresh();
    });
  }

  const canProcess = ["PENDING", "UNDER_REVIEW", "REVISION_REQUESTED"].includes(status);

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Moderatör işlemleri</h2>
          <p className="mt-1 text-sm text-muted">Başvuruyu incelemeye alın, onaylayın veya kullanıcıdan eksik belge isteyin.</p>
        </div>
        <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold">{canProcess ? "İşleme açık" : "İşlem tamamlandı"}</span>
      </div>
      <label className="mt-5 grid gap-2 text-sm font-semibold">
        Açıklama / eksik belge notu
        <textarea className="min-h-24 rounded-2xl border border-line bg-surface-strong p-3 font-normal" disabled={!canProcess || pending} onChange={(event) => setReason(event.target.value)} placeholder="Örn. Kimlik belgesi veya sanatçı profil bağlantısı eksik." value={reason} />
      </label>
      <label className="mt-4 flex items-start gap-3 rounded-2xl border border-line bg-surface-strong p-3 text-sm">
        <input
          checked={verificationConfirmed}
          className="mt-0.5 size-4 accent-accent"
          disabled={!canProcess || pending}
          onChange={(event) => setVerificationConfirmed(event.target.checked)}
          type="checkbox"
        />
        <span>
          <span className="font-semibold">Doğrulama kanıtını kontrol ettim</span>
          <span className="mt-1 block text-xs text-muted">Bağlantının gerçekten bu sanatçıya ait olduğunu ve başvuru bilgileriyle eşleştiğini kontrol etmeden onaylamayın.</span>
        </span>
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-full border border-line px-4 py-2 text-sm font-semibold disabled:opacity-40" disabled={!canProcess || pending || status !== "PENDING"} onClick={() => run("START_REVIEW")} type="button">İncelemeye al</button>
        <button className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-40" disabled={!canProcess || pending} onClick={() => run("APPROVE")} type="button">Onayla</button>
        <button className="rounded-full border border-orange-400 px-4 py-2 text-sm font-semibold text-orange-700 disabled:opacity-40" disabled={!canProcess || pending} onClick={() => run("REQUEST_REVISION")} type="button">Eksik belge / revizyon iste</button>
        <button className="rounded-full border border-danger px-4 py-2 text-sm font-semibold text-danger disabled:opacity-40" disabled={!canProcess || pending} onClick={() => run("REJECT")} type="button">Reddet</button>
      </div>
      {message ? <p className="mt-3 rounded-xl border border-line bg-surface-strong p-3 text-sm" role="status">{message}</p> : null}
    </section>
  );
}
