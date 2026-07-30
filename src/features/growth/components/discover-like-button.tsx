"use client";
import { useState } from "react";
import { Heart } from "lucide-react";

export function DiscoverLikeButton({ trackId, releaseId, externalMediaId, variant = "default", onLiked }: { trackId?: string | null | undefined; releaseId?: string | null | undefined; externalMediaId?: string | null | undefined; variant?: "default" | "overlay"; onLiked?: () => void }) {
  const [state, setState] = useState<"idle" | "liked" | "error">("idle");
  const [pending, setPending] = useState(false);
  async function like() {
    if (state === "liked" || pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/growth/like", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(trackId ? { trackId } : releaseId ? { releaseId } : { externalMediaId }) });
      setState(response.ok ? "liked" : "error");
      if (response.ok) onLiked?.();
    } catch {
      setState("error");
    } finally {
      setPending(false);
    }
  }
  return <div className="flex items-center gap-2"><button aria-label="Beğen" className={variant === "overlay" ? `inline-flex size-12 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white backdrop-blur transition hover:bg-black/75 ${state === "liked" ? "text-rose-400" : ""}` : `inline-flex size-11 items-center justify-center rounded-full border border-line ${state === "liked" ? "bg-danger/10 text-danger" : "bg-background text-foreground"}`} disabled={pending} onClick={() => void like()} type="button"><Heart className={state === "liked" ? "size-5 fill-current" : "size-5"} /></button>{state === "error" ? <span className="text-xs text-danger">Oy verilemedi</span> : null}</div>;
}
