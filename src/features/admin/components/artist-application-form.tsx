"use client";

import { useState } from "react";

export function ArtistApplicationForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/artist-applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const payload = (await response.json()) as { error?: string; message?: string; success?: boolean };
      if (!response.ok) throw new Error(payload.error ?? payload.message ?? "Başvuru gönderilemedi.");
      setMessage("Başvurunuz alındı. Admin incelemesi tamamlandığında bildirim alacaksınız.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Başvuru gönderilemedi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={submit} className="mt-8 grid gap-4">
      <label className="grid gap-2 text-sm font-medium">Sahne adı<input className="rounded-xl border border-line bg-white px-4 py-3" name="stageName" required /></label>
      <label className="grid gap-2 text-sm font-medium">Yasal ad<input className="rounded-xl border border-line bg-white px-4 py-3" name="legalName" required /></label>
      <label className="grid gap-2 text-sm font-medium">Biyografi<textarea className="min-h-32 rounded-xl border border-line bg-white px-4 py-3" name="biography" required /></label>
      <label className="grid gap-2 text-sm font-medium">Spotify sanatçı linki<input className="rounded-xl border border-line bg-white px-4 py-3" name="spotifyArtistUrl" type="url" /></label>
      <label className="grid gap-2 text-sm font-medium">Apple Music linki<input className="rounded-xl border border-line bg-white px-4 py-3" name="appleMusicArtistUrl" type="url" /></label>
      <label className="grid gap-2 text-sm font-medium">YouTube kanalı<input className="rounded-xl border border-line bg-white px-4 py-3" name="youtubeChannelUrl" type="url" /></label>
      <button className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? "Gönderiliyor…" : "Sanatçı başvurusu gönder"}</button>
      {message ? <p className="rounded-xl border border-line bg-surface p-3 text-sm">{message}</p> : null}
    </form>
  );
}
