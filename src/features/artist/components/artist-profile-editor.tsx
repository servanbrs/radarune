"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type ArtistProfileEditorProps = {
  artist: { id: string; name: string; slug: string; shortBiography: string | null };
};

export function ArtistProfileEditor({ artist }: ArtistProfileEditorProps) {
  const [name, setName] = useState(artist.name);
  const [slug, setSlug] = useState(artist.slug);
  const [shortBiography, setShortBiography] = useState(artist.shortBiography ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/artists/${artist.id}/profile`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug, shortBiography: shortBiography || null }) });
      const result: unknown = await response.json();
      if (!response.ok || typeof result !== "object" || result === null || !("name" in result)) {
        const apiError = typeof result === "object" && result !== null && "error" in result && typeof result.error === "string" ? result.error : "Profil kaydedilemedi.";
        throw new Error(apiError);
      }
      setMessage("Profil güncellendi.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Profil kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[0.2em] text-muted">Sanatçı profili</p><h1 className="mt-2 text-3xl font-semibold">{artist.name}</h1></div>
        <Link className="rounded-xl border px-4 py-2 text-sm" href={`/artist/${slug}`}>Önizlemeyi aç</Link>
      </div>
      <form className="panel grid gap-5 p-6" onSubmit={submit}>
        <p className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">Güncellemeler tenant ve sanatçı ekip yetkisiyle sunucuda doğrulanır. Slug değişiklikleri eski URL yönlendirmesi için saklanır.</p>
        <label className="grid gap-2 text-sm">Sanatçı adı<input className="h-11 rounded-xl border bg-transparent px-3" value={name} onChange={(event) => setName(event.target.value)} required /></label>
        <label className="grid gap-2 text-sm">URL slug<input className="h-11 rounded-xl border bg-transparent px-3" value={slug} onChange={(event) => setSlug(event.target.value)} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
        <label className="grid gap-2 text-sm">Kısa biyografi<textarea className="min-h-28 rounded-xl border bg-transparent p-3" value={shortBiography} onChange={(event) => setShortBiography(event.target.value)} /></label>
        {error ? <p className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
        {message ? <p className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm text-accent">{message}</p> : null}
        <button className="rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background disabled:opacity-50" disabled={saving} type="submit">{saving ? "Kaydediliyor..." : "Profili kaydet"}</button>
      </form>
    </main>
  );
}
