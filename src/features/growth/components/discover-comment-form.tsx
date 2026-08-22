"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { localize } from "@/lib/i18n";

type ChannelActor = { id: string; name: string; slug: string };
type Comment = { id: string; content: string; createdAt: string; authorUser: { name: string | null; username: string | null }; authorArtist?: { name: string; slug: string } | null; replies?: Comment[] };

function appendReply(comments: Comment[], parentId: string, reply: Comment): Comment[] {
  return comments.map((comment) =>
    comment.id === parentId
      ? { ...comment, replies: [...(comment.replies ?? []), reply] }
      : comment.replies?.length
        ? { ...comment, replies: appendReply(comment.replies, parentId, reply) }
        : comment,
  );
}

function replaceComment(comments: Comment[], commentId: string, replacement: Comment): Comment[] {
  return comments.map((comment) =>
    comment.id === commentId
      ? replacement
      : comment.replies?.length
        ? { ...comment, replies: replaceComment(comment.replies, commentId, replacement) }
        : comment,
  );
}

function removeComment(comments: Comment[], commentId: string): Comment[] {
  return comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) =>
      comment.replies?.length
        ? { ...comment, replies: removeComment(comment.replies, commentId) }
        : comment,
    );
}

export function DiscoverCommentForm({ trackId, releaseId, externalMediaId, isAuthenticated = false, loginHref = "/sign-in?next=/discover", locale = "tr-TR", channelActors = [] }: { trackId?: string | null | undefined; releaseId?: string | null | undefined; externalMediaId?: string | null | undefined; isAuthenticated?: boolean; loginHref?: string; locale?: string; channelActors?: ChannelActor[] }) {
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [selectedArtistId, setSelectedArtistId] = useState("");
  const optimisticSequence = useRef(0);

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
    const normalizedContent = value.trim();
    optimisticSequence.current += 1;
    const optimisticId = `pending-${optimisticSequence.current}`;
    const optimisticComment: Comment = {
      id: optimisticId,
      content: normalizedContent,
      createdAt: "",
      authorUser: { name: "Siz", username: null },
      authorArtist: channelActors.find((artist) => artist.id === selectedArtistId) ?? null,
      replies: [],
    };

    setPending(true);
    setMessage(null);
    setComments((current) =>
      parentCommentId
        ? appendReply(current, parentCommentId, optimisticComment)
        : [optimisticComment, ...current],
    );

    let response: Response;
    try {
      response = await fetch("/api/growth/comments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: normalizedContent, ...(trackId ? { trackId } : releaseId ? { releaseId } : { externalMediaId }), ...(selectedArtistId ? { artistId: selectedArtistId } : {}), ...(parentCommentId ? { parentCommentId } : {}) }) });
    } catch {
      setPending(false);
      setComments((current) => removeComment(current, optimisticId));
      setMessage(localize(locale, { tr: "Bağlantı kurulamadı. Lütfen tekrar deneyin.", en: "Could not connect. Please try again.", de: "Verbindung fehlgeschlagen. Bitte versuche es erneut." }));
      return;
    }
    setPending(false);
    if (!response.ok) {
      setComments((current) => removeComment(current, optimisticId));
      let errorMessage = localize(locale, { tr: "Yorum gönderilemedi. Lütfen tekrar deneyin.", en: "Comment could not be sent. Please try again.", de: "Kommentar konnte nicht gesendet werden. Bitte versuche es erneut." });
      try {
        const payload = await response.json() as { error?: string };
        if (payload.error) errorMessage = payload.error;
      } catch {
        // Keep a friendly fallback when an upstream error is not JSON.
      }
      setMessage(errorMessage);
      return;
    }
    const createdComment = await response.json() as Comment;
    setComments((current) => replaceComment(current, optimisticId, {
      ...createdComment,
      createdAt: String(createdComment.createdAt),
      replies: [],
    }));
    if (parentCommentId) { setReplyContent(""); setReplyTo(null); } else setContent("");
    setMessage(parentCommentId
      ? localize(locale, { tr: "Yanıtınız yayınlandı.", en: "Your reply was posted.", de: "Deine Antwort wurde veröffentlicht." })
      : localize(locale, { tr: "Yorumunuz yayınlandı.", en: "Your comment was posted.", de: "Dein Kommentar wurde veröffentlicht." }));
  }
  function renderComment(comment: Comment, depth = 0) {
    return <div className={depth ? "ml-5 border-l border-line pl-3" : ""} key={comment.id}>
      <div className="rounded-2xl bg-surface-strong px-4 py-3"><p className="text-xs font-semibold">{comment.authorArtist?.name ?? comment.authorUser.name ?? comment.authorUser.username ?? localize(locale, { tr: "Radarune üyesi", en: "Radarune member", de: "Radarune-Mitglied" })}{comment.authorArtist ? <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">Sanatçı kanalı</span> : null}</p><p className="mt-1 text-sm text-muted">{comment.content}</p>{isAuthenticated ? <button className="mt-2 text-xs font-semibold text-accent hover:underline" onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} type="button">{replyTo === comment.id ? localize(locale, { tr: "Vazgeç", en: "Cancel", de: "Abbrechen" }) : localize(locale, { tr: "Yanıtla", en: "Reply", de: "Antworten" })}</button> : null}</div>
      {replyTo === comment.id && isAuthenticated ? <form className="mt-2 flex gap-2" onSubmit={(event) => submit(event, comment.id)}><input aria-label={localize(locale, { tr: "Yanıt", en: "Reply", de: "Antwort" })} className="min-w-0 flex-1 rounded-full border border-line bg-background px-3 py-2 text-xs outline-none focus:border-accent" maxLength={2000} onChange={(event) => setReplyContent(event.target.value)} placeholder={localize(locale, { tr: "Yanıt yaz...", en: "Write a reply...", de: "Antwort schreiben..." })} value={replyContent} /><button className="rounded-full bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground disabled:opacity-50" disabled={pending || !replyContent.trim()} type="submit">{localize(locale, { tr: "Gönder", en: "Send", de: "Senden" })}</button></form> : null}
      {comment.replies?.length ? <div className="mt-2 space-y-2">{comment.replies.map((reply) => renderComment(reply, depth + 1))}</div> : null}
    </div>;
  }
  return <div className="mt-4 border-t border-line pt-4">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{localize(locale, { tr: "Yorumlar", en: "Comments", de: "Kommentare" })} {comments.length ? `(${comments.length})` : ""}</p>
    <div className="mt-3 space-y-2">{comments.map((comment) => renderComment(comment))}</div>
    {isAuthenticated ? <form className="mt-3 flex flex-wrap gap-2" onSubmit={submit}>{channelActors.length ? <label className="basis-full text-xs text-muted">{localize(locale, { tr: "Yorum kimliği", en: "Comment identity", de: "Kommentaridentität" })}<select className="ml-2 rounded-full border border-line bg-background px-3 py-2 text-xs font-medium" onChange={(event) => setSelectedArtistId(event.target.value)} value={selectedArtistId}><option value="">{localize(locale, { tr: "Kişisel hesabım", en: "My personal account", de: "Mein persönliches Konto" })}</option>{channelActors.map((artist) => <option key={artist.id} value={artist.id}>{artist.name} kanalı</option>)}</select></label> : null}<input aria-label={localize(locale, { tr: "Yorum", en: "Comment", de: "Kommentar" })} className="min-w-0 flex-1 rounded-full border border-line bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20" maxLength={2000} onChange={(event) => { setContent(event.target.value); setMessage(null); }} placeholder={localize(locale, { tr: "Yorum yaz...", en: "Write a comment...", de: "Kommentar schreiben..." })} value={content} /><button aria-label={localize(locale, { tr: "Yorumu gönder", en: "Send comment", de: "Kommentar senden" })} className="min-h-11 rounded-full bg-accent px-5 py-3 text-xs font-semibold text-accent-foreground shadow-sm transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50" disabled={pending || !content.trim()} type="submit">{pending ? localize(locale, { tr: "Gönderiliyor…", en: "Sending…", de: "Wird gesendet…" }) : localize(locale, { tr: "Yorumu gönder", en: "Send comment", de: "Kommentar senden" })}</button>{message ? <span className={`basis-full text-xs ${message.includes("yayınlandı") || message.includes("posted") || message.includes("veröffentlicht") ? "text-accent" : "text-red-500"}`} role="status">{message}</span> : null}</form> : <p className="mt-3 text-sm text-muted">{localize(locale, { tr: "Yorum yapmak için ", en: "Please ", de: "Zum Kommentieren " })}<Link className="font-semibold text-accent underline-offset-4 hover:underline" href={loginHref}>{localize(locale, { tr: "giriş yapın", en: "sign in", de: "anmelden" })}</Link>.</p>}
  </div>;
}
