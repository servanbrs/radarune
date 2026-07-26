"use client";

import { useState } from "react";
import { Check, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type GlobalPlaylistVoteCardProps = {
  playlist: {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    featured: boolean;
    tracks: Array<{ track: { id: string; title: string }; release: { title: string } | null }>;
    campaign: { slug: string; active: boolean; endsAt: string; voteCount: number } | null;
  };
};

function getError(payload: unknown) {
  return typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : "Oy kaydedilemedi.";
}

export function GlobalPlaylistVoteCard({ playlist }: GlobalPlaylistVoteCardProps) {
  const [voteCount, setVoteCount] = useState(playlist.campaign?.voteCount ?? 0);
  const [voted, setVoted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const campaignOpen = Boolean(playlist.campaign?.active && playlist.campaign.endsAt && new Date(playlist.campaign.endsAt).getTime() > now);

  async function vote() {
    if (!playlist.campaign || voted) return;
    setMessage(null);
    const response = await fetch(`/api/public/v1/campaigns/${playlist.campaign.slug}/vote`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ entityId: playlist.id, entityType: "PLAYLIST", idempotencyKey: `web-${crypto.randomUUID()}` }) });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(getError(payload));
      return;
    }
    setVoted(true);
    setVoteCount((value) => value + 1);
  }

  return <article className="rounded-[1.5rem] border border-line bg-surface p-5">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.18em] text-accent">{playlist.featured ? "Editör seçimi" : "Global playlist"}</p><h3 className="mt-2 text-xl font-semibold">{playlist.name}</h3></div><span className="rounded-full border border-line px-3 py-1 text-xs font-semibold">{voteCount} oy</span></div>
    {playlist.description ? <p className="mt-3 text-sm leading-6 text-muted">{playlist.description}</p> : null}
    <div className="mt-5 grid gap-2">{playlist.tracks.slice(0, 5).map((item, index) => <div className="flex items-center gap-3 rounded-xl border border-line/70 px-3 py-2 text-sm" key={item.track.id}><span className="font-mono text-xs text-muted">{String(index + 1).padStart(2, "0")}</span><span className="truncate font-medium">{item.track.title}</span><span className="ml-auto shrink-0 text-xs text-muted">{item.release?.title ?? "Yayın"}</span></div>)}{playlist.tracks.length === 0 ? <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">Bu playlist henüz parça bekliyor.</p> : null}</div>
    <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4"><p className="text-xs text-muted">{campaignOpen ? "Gerçek kullanıcı oylaması açık" : "Oylama şu anda kapalı"}</p><Button disabled={!campaignOpen || voted} size="sm" type="button" onClick={() => void vote()}>{voted ? <><Check className="mr-2 h-4 w-4" aria-hidden="true" /> Oy kullanıldı</> : <><ThumbsUp className="mr-2 h-4 w-4" aria-hidden="true" /> Oy ver</>}</Button></div>
    {message ? <p className="mt-3 text-xs text-danger">{message}</p> : null}
  </article>;
}
