"use client";
import { useState } from "react";

export function DiscoverCommentForm({ trackId, releaseId }: { trackId?: string | null; releaseId?: string | null }) {
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    setPending(true); setMessage(null);
    const response = await fetch("/api/growth/comments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content, ...(trackId ? { trackId } : { releaseId }) }) });
    setPending(false);
    if (!response.ok) { setMessage("Yorum gönderilemedi."); return; }
    setContent(""); setMessage("Yorumunuz yayınlandı.");
  }
  return <form className="mt-3 flex gap-2" onSubmit={submit}><input aria-label="Yorum" className="min-w-0 flex-1 rounded-full border border-line bg-background px-4 py-2 text-sm" maxLength={2000} onChange={(event) => setContent(event.target.value)} placeholder="Yorum yaz..." value={content} /><button className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-white disabled:opacity-50" disabled={pending || !content.trim()} type="submit">{pending ? "..." : "Yorum"}</button>{message ? <span className="sr-only" role="status">{message}</span> : null}</form>;
}
