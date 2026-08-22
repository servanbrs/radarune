"use client";

import { useState } from "react";

type Track = { id: string; title: string; isrc: string | null };

export function PostSubmissionReleaseEditor(props: {
  releaseId: string;
  upc: string | null;
  videoDistributionEnabled: boolean;
  videoStores: string[];
  videoUploaded: boolean;
  tracks: Track[];
}) {
  const [upc, setUpc] = useState(props.upc ?? "");
  const [tracks, setTracks] = useState(props.tracks.map((track) => ({ ...track, isrc: track.isrc ?? "" })));
  const [videoEnabled, setVideoEnabled] = useState(props.videoDistributionEnabled);
  const [videoStores, setVideoStores] = useState(props.videoStores.join(", "));
  const [videoUploaded, setVideoUploaded] = useState(props.videoUploaded);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/releases/${props.releaseId}/supplemental`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upc,
          videoDistributionEnabled: videoEnabled,
          videoStores: videoStores.split(",").map((value) => value.trim()).filter(Boolean),
          tracks: tracks.map(({ id, isrc }) => ({ id, isrc })),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Kaydedilemedi.");
      setStatus("Ek yayın bilgileri kaydedildi.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Kaydetme sırasında bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadVideo(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("kind", "VIDEO");
      const response = await fetch(`/api/releases/${props.releaseId}/uploads`, { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Klip yüklenemedi.");
      setVideoUploaded(true);
      setVideoEnabled(true);
      setStatus("Klip yüklendi. Dağıtım tercihini kaydetmeyi unutmayın.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Klip yüklenemedi.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="panel space-y-6 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Gönderilmiş yayın bilgileri</p>
        <h2 className="mt-2 text-2xl font-semibold">Kodları ve klibi sonradan güncelle</h2>
        <p className="mt-2 text-sm text-muted">Yayın gönderildikten sonra yalnızca ek medya ve kimlik kodları değiştirilebilir. Başlık, sanatçı ve dağıtım kapsamı güvenlik için kilitlidir.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">UPC / EAN<input value={upc} onChange={(event) => setUpc(event.target.value)} className="input" inputMode="numeric" placeholder="12 veya 13 hane" /></label>
        <label className="space-y-2 text-sm font-medium">Klip dosyası<input type="file" accept="video/*" disabled={uploading} onChange={(event) => uploadVideo(event.target.files?.[0])} className="input" />{videoUploaded ? <span className="block text-xs text-accent">Klip yüklendi</span> : null}</label>
      </div>
      <div className="space-y-3">
        <h3 className="font-semibold">Parça ISRC kodları</h3>
        {tracks.map((track, index) => <label key={track.id} className="grid gap-2 text-sm md:grid-cols-[1fr_240px] md:items-center"><span>{track.title}</span><input value={track.isrc} onChange={(event) => setTracks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, isrc: event.target.value.toUpperCase() } : item))} className="input" placeholder="TRABC2400001" /></label>)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={videoEnabled} onChange={(event) => setVideoEnabled(event.target.checked)} /> Klip dağıtımını etkinleştir</label>
        <label className="space-y-2 text-sm font-medium">Klip mağazaları<input value={videoStores} onChange={(event) => setVideoStores(event.target.value)} className="input" placeholder="YOUTUBE, META_VIDEO" /></label>
      </div>
      <p className="text-xs text-muted">ONErpm resmi API veya webhook ile UPC/ISRC döndürürse dağıtım işleyicisi bu alanlarla otomatik eşleştirir. Resmi bağlantı yoksa kodlar buradan güvenli şekilde girilebilir.</p>
      {status ? <p className="text-sm text-muted" role="status">{status}</p> : null}
      <button type="button" onClick={save} disabled={saving || uploading} className="button-primary">{saving ? "Kaydediliyor…" : "Ek bilgileri kaydet"}</button>
    </section>
  );
}
