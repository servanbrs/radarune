"use client";

import { Heart } from "lucide-react";
import { useState } from "react";

type ChannelActor = { id: string; name: string };

export function ArtistChannelLikeButton({ releaseId, trackId, externalMediaId, actors }: { releaseId?: string; trackId?: string; externalMediaId?: string; actors: ChannelActor[] }) {
  const [artistId, setArtistId] = useState(actors[0]?.id ?? "");
  const [state, setState] = useState<"idle" | "liked" | "error">("idle");
  const [pending, setPending] = useState(false);
  if (!actors.length) return null;

  async function likeAsChannel() {
    if (!artistId || pending || state === "liked") return;
    setPending(true);
    try {
      const response = await fetch("/api/growth/like", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ artistId, ...(releaseId ? { releaseId } : trackId ? { trackId } : { externalMediaId }) }),
      });
      setState(response.ok ? "liked" : "error");
    } catch {
      setState("error");
    } finally {
      setPending(false);
    }
  }

  return <div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor="artist-channel-like">Kanal hesabı</label><select className="rounded-full border border-line bg-background px-3 py-2 text-xs font-medium" id="artist-channel-like" onChange={(event) => { setArtistId(event.target.value); setState("idle"); }} value={artistId}>{actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.name} kanalı</option>)}</select><button aria-label="Kanal olarak beğen" className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${state === "liked" ? "border-accent bg-accent/10 text-accent" : "border-line bg-background hover:border-accent"}`} disabled={pending || state === "liked"} onClick={() => void likeAsChannel()} type="button"><Heart className={state === "liked" ? "size-4 fill-current" : "size-4"} />{state === "liked" ? "Kanal beğendi" : "Kanal olarak beğen"}</button>{state === "error" ? <span className="text-xs text-danger">İşlem başarısız</span> : null}</div>;
}
