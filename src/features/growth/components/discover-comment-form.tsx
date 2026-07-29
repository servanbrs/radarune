"use client";
import { useEffect, useState } from "react";

type Comment = { id: string; content: string; createdAt: string; authorUser: { name: string | null; username: string | null } };

export function DiscoverCommentForm({ trackId, releaseId, isAuthenticated = false }: { trackId?: string | null; releaseId?: string | null; isAuthenticated?: boolean }) {
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  async function loadComments() {
    const query = new URLSearchParams(trackId ? { trackId } : { releaseId: releaseId ?? "" });
    const response = await fetch(`/api/growth/comments?${query.toString()}`, { cache: "no-store" });
    if (response.ok) setComments(await response.json());
  }

  useEffect(() => {
    let cancelled = false;
    const query = new URLSearchParams(trackId ? { trackId } : { releaseId: releaseId ?? "" });
    fetch(`/api/growth/comments?${query.toString()}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : [])
      .then((data: Comment[]) => { if (!cancelled) setComments(data); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [trackId, releaseId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    setPending(true); setMessage(null);
    const response = await fetch("/api/growth/comments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content, ...(trackId ? { trackId } : { releaseId }) }) });
    setPending(false);
    if (!response.ok) { setMessage("Yorum gönderilemedi."); return; }
    setContent(""); setMessage("Yorumunuz yayınlandı."); void loadComments();
  }
  return <div className="mt-4 border-t border-line pt-4">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Yorumlar {comments.length ? `(${comments.length})` : ""}</p>
    <div className="mt-3 space-y-2">{comments.map((comment) => <div className="rounded-2xl bg-surface-strong px-4 py-3" key={comment.id}><p className="text-xs font-semibold">{comment.authorUser.name ?? comment.authorUser.username ?? "Radarune üyesi"}</p><p className="mt-1 text-sm text-muted">{comment.content}</p></div>)}</div>
    {isAuthenticated ? <form className="mt-3 flex gap-2" onSubmit={submit}><input aria-label="Yorum" className="min-w-0 flex-1 rounded-full border border-line bg-background px-4 py-2 text-sm" maxLength={2000} onChange={(event) => setContent(event.target.value)} placeholder="Yorum yaz..." value={content} /><button className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-white disabled:opacity-50" disabled={pending || !content.trim()} type="submit">{pending ? "..." : "Yorum"}</button>{message ? <span className="sr-only" role="status">{message}</span> : null}</form> : <p className="mt-3 text-xs text-muted">Yorum yapmak için giriş yapın.</p>}
  </div>;
}
