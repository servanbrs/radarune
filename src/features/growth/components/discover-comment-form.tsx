"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type Comment = { id: string; content: string; createdAt: string; authorUser: { name: string | null; username: string | null }; replies?: Comment[] };

export function DiscoverCommentForm({ trackId, releaseId, externalMediaId, isAuthenticated = false, loginHref = "/sign-in?next=/discover" }: { trackId?: string | null | undefined; releaseId?: string | null | undefined; externalMediaId?: string | null | undefined; isAuthenticated?: boolean; loginHref?: string }) {
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  async function loadComments() {
    try {
      const query = new URLSearchParams(trackId ? { trackId } : releaseId ? { releaseId } : { externalMediaId: externalMediaId ?? "" });
      const response = await fetch(`/api/growth/comments?${query.toString()}`, { cache: "no-store" });
      if (response.ok) setComments(await response.json());
    } catch {
      // A temporary network failure must not surface as an uncaught client error.
    }
  }

  useEffect(() => {
    let cancelled = false;
    const query = new URLSearchParams(trackId ? { trackId } : releaseId ? { releaseId } : { externalMediaId: externalMediaId ?? "" });
    fetch(`/api/growth/comments?${query.toString()}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : [])
      .then((data: Comment[]) => { if (!cancelled) setComments(data); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [trackId, releaseId, externalMediaId]);

  async function submit(event: FormEvent, parentCommentId?: string) {
    event.preventDefault();
    const value = parentCommentId ? replyContent : content;
    if (!value.trim()) return;
    setPending(true); setMessage(null);
    let response: Response;
    try {
      response = await fetch("/api/growth/comments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: value.trim(), ...(trackId ? { trackId } : releaseId ? { releaseId } : { externalMediaId }), ...(parentCommentId ? { parentCommentId } : {}) }) });
    } catch {
      setPending(false);
      setMessage("Bağlantı kurulamadı. Lütfen tekrar deneyin.");
      return;
    }
    setPending(false);
    if (!response.ok) {
      let errorMessage = "Yorum gönderilemedi. Lütfen tekrar deneyin.";
      try {
        const payload = await response.json() as { error?: string };
        if (payload.error) errorMessage = payload.error;
      } catch {
        // Keep a friendly fallback when an upstream error is not JSON.
      }
      setMessage(errorMessage);
      return;
    }
    if (parentCommentId) { setReplyContent(""); setReplyTo(null); } else setContent("");
    setMessage(parentCommentId ? "Yanıtınız yayınlandı." : "Yorumunuz yayınlandı."); void loadComments();
  }
  function renderComment(comment: Comment, depth = 0) {
    return <div className={depth ? "ml-5 border-l border-line pl-3" : ""} key={comment.id}>
      <div className="rounded-2xl bg-surface-strong px-4 py-3"><p className="text-xs font-semibold">{comment.authorUser.name ?? comment.authorUser.username ?? "Radarune üyesi"}</p><p className="mt-1 text-sm text-muted">{comment.content}</p>{isAuthenticated ? <button className="mt-2 text-xs font-semibold text-accent hover:underline" onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} type="button">{replyTo === comment.id ? "Vazgeç" : "Yanıtla"}</button> : null}</div>
      {replyTo === comment.id && isAuthenticated ? <form className="mt-2 flex gap-2" onSubmit={(event) => submit(event, comment.id)}><input aria-label="Yanıt" className="min-w-0 flex-1 rounded-full border border-line bg-background px-3 py-2 text-xs outline-none focus:border-accent" maxLength={2000} onChange={(event) => setReplyContent(event.target.value)} placeholder="Yanıt yaz..." value={replyContent} /><button className="rounded-full bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-50" disabled={pending || !replyContent.trim()} type="submit">Gönder</button></form> : null}
      {comment.replies?.length ? <div className="mt-2 space-y-2">{comment.replies.map((reply) => renderComment(reply, depth + 1))}</div> : null}
    </div>;
  }
  return <div className="mt-4 border-t border-line pt-4">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Yorumlar {comments.length ? `(${comments.length})` : ""}</p>
    <div className="mt-3 space-y-2">{comments.map((comment) => renderComment(comment))}</div>
    {isAuthenticated ? <form className="mt-3 flex flex-wrap gap-2" onSubmit={submit}><input aria-label="Yorum" className="min-w-0 flex-1 rounded-full border border-line bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20" maxLength={2000} onChange={(event) => { setContent(event.target.value); setMessage(null); }} placeholder="Yorum yaz..." value={content} /><button aria-label="Yorumu gönder" className="min-h-11 rounded-full bg-accent px-5 py-3 text-xs font-semibold text-accent-foreground shadow-sm transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50" disabled={pending || !content.trim()} type="submit">{pending ? "Gönderiliyor…" : "Yorumu gönder"}</button>{message ? <span className={`basis-full text-xs ${message.includes("yayınlandı") ? "text-accent" : "text-red-500"}`} role="status">{message}</span> : null}</form> : <p className="mt-3 text-sm text-muted">Yorum yapmak için <Link className="font-semibold text-accent underline-offset-4 hover:underline" href={loginHref}>giriş yapın</Link>.</p>}
  </div>;
}
