"use client";
import { useState } from "react";
import { Heart } from "lucide-react";

export function DiscoverLikeButton({ trackId, releaseId, externalMediaId }: { trackId?: string | null | undefined; releaseId?: string | null | undefined; externalMediaId?: string | null | undefined }) {
  const [state, setState] = useState<"idle" | "liked" | "error">("idle");
  const [pending, setPending] = useState(false);
  async function like() {
    if (state === "liked" || pending) return;
    setPending(true);
    const response = await fetch("/api/growth/like", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(trackId ? { trackId } : releaseId ? { releaseId } : { externalMediaId }) });
    setPending(false);
    setState(response.ok ? "liked" : "error");
  }
  return <div className="flex items-center gap-2"><button aria-label="Beğen" className={`inline-flex size-11 items-center justify-center rounded-full border border-line ${state === "liked" ? "bg-danger/10 text-danger" : "bg-background text-foreground"}`} disabled={pending} onClick={() => void like()} type="button"><Heart className={state === "liked" ? "size-4 fill-current" : "size-4"} /></button>{state === "error" ? <span className="text-xs text-danger">Oy verilemedi</span> : null}</div>;
}
