"use client";
/* eslint-disable @next/next/no-img-element -- Review artwork is served from private runtime storage. */

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReleaseReviewActions({ releaseId, status }: { releaseId: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const canReview = ["PENDING_REVIEW", "REVISION_REQUESTED", "DRAFT"].includes(status);
  const canQueue = status === "APPROVED";

  async function run(action: "APPROVE" | "REJECT" | "REQUEST_REVISION" | "QUEUE_DISTRIBUTION") {
    setPending(true);
    setMessage(null);
    const needsReason = action === "REJECT" || action === "REQUEST_REVISION";
    const reason = needsReason ? window.prompt(action === "REJECT" ? "Ret gerekçesi" : "Revizyon açıklaması") ?? "" : undefined;
    if (needsReason && !(reason ?? "").trim()) { setPending(false); return; }
    const body = action === "REQUEST_REVISION"
      ? { action, reason, revisionItems: [{ category: "OTHER", fieldPath: "release", message: reason, severity: "ERROR" }] }
      : { action, ...(reason ? { reason } : {}), revisionItems: [] };
    const response = await fetch(`/api/admin/releases/${releaseId}/action`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) { setMessage(payload?.error?.includes("distribution.enabled") ? "Dağıtım özelliği sanatçı planında kapalı. Admin veya moderatör operasyon yetkisiyle bu kısıt aşılabilir; sanatçı hesabı için Faturalandırma bölümünden dağıtım özelliğini içeren planı etkinleştirin." : payload?.error ?? "İşlem başarısız."); return; }
    setMessage(action === "QUEUE_DISTRIBUTION" ? "Dağıtım kuyruğuna alındı." : action === "REQUEST_REVISION" ? "Revizyon isteği kullanıcıya bildirildi." : "İşlem tamamlandı.");
    router.refresh();
  }

  return <section className="panel border-line bg-surface p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">İnceleme işlemleri</p><p className="mt-1 text-sm text-muted">Ses, kapak ve yayın bilgilerini kontrol ederek kullanıcıya net geri bildirim verin.</p></div><div className="flex flex-wrap gap-2">{canReview ? <><button className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50" disabled={pending} onClick={() => void run("APPROVE")}>Onayla</button>{status !== "DRAFT" ? <button className="rounded-full border border-orange-400 px-4 py-2 text-sm font-semibold text-orange-600 disabled:opacity-50" disabled={pending} onClick={() => void run("REQUEST_REVISION")}>Revizyon iste</button> : null}<button className="rounded-full border border-danger px-4 py-2 text-sm font-semibold text-danger disabled:opacity-50" disabled={pending} onClick={() => void run("REJECT")}>Reddet</button></> : null}{canQueue ? <button className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-50" disabled={pending} onClick={() => void run("QUEUE_DISTRIBUTION")}>Dağıtıma al</button> : null}</div></div>{message ? <p className="mt-3 rounded-xl border border-line bg-surface-strong p-3 text-sm" role="status">{message}</p> : null}</section>;
}

export function ReleasePreview({ artworkUploadId, artworkUpload, audioUploadId, audioUpload, tracks = [] }: { artworkUploadId: string | null; artworkUpload?: { id: string; fileName: string; mimeType: string } | null; audioUploadId: string | null; audioUpload?: { id: string; fileName: string; mimeType: string } | null; uploads?: Array<{ id: string; fileName: string; mimeType: string; kind?: string }>; tracks?: Array<{ id: string; title: string; audioUploadId: string | null; uploads: Array<{ id: string; fileName: string; mimeType: string }> }> }) {
  const artwork = artworkUpload ?? (artworkUploadId ? { id: artworkUploadId, fileName: "Kapak", mimeType: "image/jpeg" } : null);
  const audio = audioUpload ?? (audioUploadId ? { id: audioUploadId, fileName: "Ses dosyası", mimeType: "audio/mpeg" } : null);
  const playableTracks = tracks.length ? tracks : audio ? [{ id: audio.id, title: audio.fileName, audioUploadId: audio.id, uploads: [audio] }] : [];
  return <section className="panel border-line bg-surface p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Ön izleme ve dosyalar</p><div className="mt-4 grid gap-5 md:grid-cols-[180px_1fr]">{artwork ? <div className="overflow-hidden rounded-2xl border border-line bg-surface-strong"><img alt={artwork.fileName} className="aspect-square w-full object-cover" src={`/api/storage/private/${artwork.id}`} /></div> : <div className="grid aspect-square place-items-center rounded-2xl border border-dashed border-line bg-surface-strong text-sm text-muted">Kapak yok</div>}<div className="flex flex-col justify-center gap-4">{playableTracks.length ? playableTracks.map((track, index) => { const trackAudio = (track.audioUploadId ? track.uploads.find((upload) => upload.id === track.audioUploadId) : null) ?? (index === 0 ? audio : null); return <div className="rounded-xl border border-line bg-surface-strong p-3" key={track.id}><p className="text-sm font-semibold">{track.title}</p>{trackAudio ? <audio className="mt-2 w-full" controls preload="metadata"><source src={`/api/storage/private/${trackAudio.id}`} type={trackAudio.mimeType} /></audio> : <p className="mt-2 text-xs text-muted">Ses dosyası yok</p>}{trackAudio ? <div className="mt-2 flex flex-wrap gap-2">{index === 0 && artwork ? <a className="inline-flex rounded-full border border-line px-3 py-2 text-xs font-semibold hover:border-accent" download href={`/api/storage/private/${artwork.id}?download=1`}>Kapağı indir</a> : null}<a className="inline-flex rounded-full border border-line px-3 py-2 text-xs font-semibold hover:border-accent" download href={`/api/storage/private/${trackAudio.id}?download=1`}>Şarkıyı indir</a></div> : null}</div>; }) : <p className="text-sm text-muted">Ses dosyası yok</p>}<p className="text-xs text-muted">Ön izleme yalnızca yetkili admin ve moderatör oturumlarında kullanılabilir.</p></div></div></section>;
}
