"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createPlaylistSchema, type CreatePlaylistInput } from "@/features/growth/schemas/growth.schema";

type PlaylistResponse = { id: string; slug: string | null };

function isPlaylistResponse(value: unknown): value is PlaylistResponse {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && (!Object.hasOwn(record, "slug") || typeof record.slug === "string" || record.slug === null);
}

export function CreatePlaylistForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rootError, setRootError] = useState<string | null>(null);
  const form = useForm<z.input<typeof createPlaylistSchema>, unknown, CreatePlaylistInput>({
    resolver: zodResolver(createPlaylistSchema),
    defaultValues: { name: "", slug: undefined, description: "", public: true },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setRootError(null);
    const response = await fetch("/api/growth/playlists", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      setRootError(typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : "Playlist oluşturulamadı.");
      return;
    }
    if (!isPlaylistResponse(payload)) {
      setRootError("Playlist yanıtı doğrulanamadı.");
      return;
    }
    const trackId = searchParams.get("trackId");
    if (trackId) await fetch(`/api/growth/playlists/${payload.id}/tracks`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ trackId }) });
    router.replace(`/playlists/${payload.id}`);
  });

  return <form className="grid gap-5" onSubmit={onSubmit}>
    <Field error={form.formState.errors.name?.message} htmlFor="playlist-name" label="Playlist adı"><Input id="playlist-name" placeholder="Gece sürüşleri" {...form.register("name")} /></Field>
    <Field error={form.formState.errors.slug?.message} hint="Public playlist adresinde kullanılır." htmlFor="playlist-slug" label="Kısa ad"><Input autoCapitalize="none" autoCorrect="off" id="playlist-slug" placeholder="gece-surusleri" {...form.register("slug")} /></Field>
    <Field error={form.formState.errors.description?.message} htmlFor="playlist-description" label="Açıklama"><textarea className="min-h-28 rounded-2xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-accent" id="playlist-description" placeholder="Bu playlistin bağlamı" {...form.register("description")} /></Field>
    <label className="flex items-center gap-3 text-sm"><input className="size-4 accent-[var(--accent)]" type="checkbox" {...form.register("public")} /> Playlisti public olarak yayınla</label>
    {rootError ? <p className="rounded-2xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger">{rootError}</p> : null}
    <Button disabled={form.formState.isSubmitting} type="submit">{form.formState.isSubmitting ? "Oluşturuluyor..." : "Playlist oluştur"}</Button>
  </form>;
}
