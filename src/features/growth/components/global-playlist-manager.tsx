"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { globalPlaylistCreateSchema } from "@/features/growth/schemas/growth.schema";

type PlaylistItem = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  featured: boolean;
  tracks: Array<{ id: string; track: { id: string; title: string; trackNumber: number }; release: { title: string } | null }>;
  campaign: { id: string; slug: string; active: boolean; endsAt: string; voteCount: number } | null;
};

type TrackItem = { id: string; title: string; trackNumber: number; release: { id: string; title: string } };
type CreateValues = z.input<typeof globalPlaylistCreateSchema>;

function errorMessage(payload: unknown, fallback: string) {
  return typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : fallback;
}

export function GlobalPlaylistManager({ initialPlaylists, tracks }: { initialPlaylists: PlaylistItem[]; tracks: TrackItem[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<CreateValues>({ resolver: zodResolver(globalPlaylistCreateSchema), defaultValues: { name: "", slug: "", description: "", featured: false, votingEnabled: true, voteEndsAt: "" } });

  async function mutate(url: string, method: "PATCH" | "POST" | "DELETE", body?: unknown) {
    setMessage(null);
    const init: RequestInit = { method };
    if (body !== undefined) {
      init.headers = { "content-type": "application/json" };
      init.body = JSON.stringify(body);
    }
    const response = await fetch(url, init);
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new Error(errorMessage(payload, "İşlem tamamlanamadı."));
    router.refresh();
  }

  const onCreate = form.handleSubmit(async (values) => {
    try {
      await mutate("/api/admin/social/global-playlists", "POST", values);
      form.reset({ name: "", slug: "", description: "", featured: false, votingEnabled: true, voteEndsAt: "" });
      setMessage("Global playlist oluşturuldu ve oylama kaydı hazırlandı.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Playlist oluşturulamadı.");
    }
  });

  return <div className="grid gap-6">
    <form className="panel grid gap-5 p-6 md:grid-cols-2" onSubmit={onCreate}>
      <div className="md:col-span-2"><h2 className="text-xl font-semibold">Yeni global playlist</h2><p className="mt-2 text-sm text-muted">Canlı parçaları tüm Radarune keşif alanında yayınlayın ve gerçek kullanıcı oylamasını açın.</p></div>
      <Field error={form.formState.errors.name?.message} htmlFor="global-playlist-name" label="Playlist adı"><Input id="global-playlist-name" placeholder="Radarune Global Picks" {...form.register("name")} /></Field>
      <Field error={form.formState.errors.slug?.message} htmlFor="global-playlist-slug" label="Kısa ad"><Input id="global-playlist-slug" placeholder="global-picks" {...form.register("slug")} /></Field>
      <Field error={form.formState.errors.description?.message} htmlFor="global-playlist-description" label="Açıklama"><Input id="global-playlist-description" placeholder="Editoryal playlist açıklaması" {...form.register("description")} /></Field>
      <Field error={form.formState.errors.voteEndsAt?.message} hint="Oylama bu tarihte kapanır." htmlFor="global-playlist-vote-ends" label="Oylama bitişi"><Input id="global-playlist-vote-ends" type="datetime-local" {...form.register("voteEndsAt")} /></Field>
      <div className="flex flex-wrap items-center gap-5 text-sm md:col-span-2"><label className="flex items-center gap-2"><input className="size-4 accent-[var(--accent)]" type="checkbox" {...form.register("featured")} /> Öne çıkar</label><label className="flex items-center gap-2"><input className="size-4 accent-[var(--accent)]" type="checkbox" {...form.register("votingEnabled")} /> Oylamayı aç</label></div>
      <Button className="md:col-span-2" disabled={form.formState.isSubmitting} type="submit">{form.formState.isSubmitting ? "Oluşturuluyor..." : "Global playlist oluştur"}</Button>
    </form>
    {initialPlaylists.map((playlist) => <article className="panel grid gap-5 p-6" key={playlist.id}>
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">{playlist.name}</h2><p className="mt-1 text-sm text-muted">/{playlist.slug} · {playlist.tracks.length} parça · {playlist.campaign?.voteCount ?? 0} geçerli oy</p></div><div className="flex gap-2"><Button size="sm" type="button" variant="ghost" onClick={() => mutate(`/api/admin/social/global-playlists/${playlist.id}`, "PATCH", { featured: !playlist.featured }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Playlist güncellenemedi."))}>{playlist.featured ? "Öne çıkarmayı kaldır" : "Öne çıkar"}</Button><Button className="text-danger" size="sm" type="button" variant="ghost" onClick={() => mutate(`/api/admin/social/global-playlists/${playlist.id}`, "DELETE").catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Playlist silinemedi."))}>Sil</Button></div></div>
      <div className="grid gap-2">{playlist.tracks.map((item) => <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-sm" key={item.id}><span>{item.track.title} <span className="text-muted">· {item.release?.title ?? "Yayın"}</span></span><Button size="sm" type="button" variant="ghost" onClick={() => mutate(`/api/admin/social/global-playlists/${playlist.id}/tracks/${item.track.id}`, "DELETE").catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Parça çıkarılamadı."))}>Çıkar</Button></div>)}{playlist.tracks.length === 0 ? <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">Henüz parça eklenmedi.</p> : null}</div>
      <div className="flex flex-wrap items-end gap-3 border-t border-line pt-4"><label className="grid min-w-64 flex-1 gap-2 text-sm font-medium">Canlı parça ekle<select className="h-11 rounded-2xl border border-line bg-surface px-3" defaultValue="" onChange={(event) => { const trackId = event.target.value; if (!trackId) return; void mutate(`/api/admin/social/global-playlists/${playlist.id}/tracks`, "POST", { trackId }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Parça eklenemedi.")); event.target.value = ""; }}><option value="">Parça seçin</option>{tracks.filter((track) => !playlist.tracks.some((item) => item.track.id === track.id)).map((track) => <option key={track.id} value={track.id}>{track.title} · {track.release.title}</option>)}</select></label><span className="rounded-full border border-line px-3 py-2 text-xs font-semibold">{playlist.campaign?.active ? "Oylama açık" : "Oylama kapalı"}</span></div>
    </article>)}
    {initialPlaylists.length === 0 ? <div className="panel border-dashed p-8 text-center text-sm text-muted">Henüz global playlist oluşturulmadı.</div> : null}
    {message ? <p className="rounded-2xl border border-line bg-surface p-4 text-sm">{message}</p> : null}
  </div>;
}
