"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  MoreVertical,
  Music2,
  Pause,
  Play,
} from "lucide-react";

import type { DiscoverFeedItem } from "@/features/growth/server/services/discover.service";
import { DiscoverCommentForm } from "@/features/growth/components/discover-comment-form";

type DiscoverFeedCardProps = {
  item: DiscoverFeedItem;
  rank: number;
  onPlay?: (item: DiscoverFeedItem) => void;
  inlinePlaying?: boolean;
  onInlinePlay?: (item: DiscoverFeedItem) => void;
  isAuthenticated?: boolean;
};

export function DiscoverFeedCard({
  item,
  onPlay,
  isAuthenticated = false,
}: DiscoverFeedCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likeCount ?? 0);
  const [playing, setPlaying] = useState(false);

  const artworkUrl =
    item.thumbnailUrl ||
    (item.releaseId
      ? `/api/public/v1/releases/${item.releaseId}/artwork`
      : null);

  async function likeItem() {
    if (!isAuthenticated) {
      window.location.assign("/sign-in?next=/discover");
      return;
    }

    const payload = item.trackId
      ? { trackId: item.trackId }
      : item.releaseId
        ? { releaseId: item.releaseId }
        : { externalMediaId: item.externalMediaId };

    try {
      const response = await fetch("/api/growth/like", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) return;

      setLiked((current) => {
        setLikeCount((count) => Math.max(0, count + (current ? -1 : 1)));
        return !current;
      });
    } catch {
      // Akış çalışmaya devam eder.
    }
  }

  function playItem() {
    setPlaying(true);
    onPlay?.(item);
  }

  const artistHref = item.artist?.slug ? `/artist/${item.artist.slug}` : null;

  return (
    <article className="overflow-hidden rounded-[28px] border border-black/10 bg-[#080a0d] shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
      <div className="relative aspect-[16/9] min-h-[360px] overflow-hidden sm:min-h-[430px]">
        {artworkUrl ? (
          <div
            aria-label={`${item.title} kapak görseli`}
            className="absolute inset-0 bg-cover bg-center"
            role="img"
            style={{
              backgroundImage: `url("${artworkUrl}")`,
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,#1d2939,#050608_70%)]">
            <Music2 className="size-20 text-white/20" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/15" />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
          <div className="flex min-w-0 items-center gap-4">
            <button
              aria-label={playing ? "Şarkıyı yeniden oynat" : "Şarkıyı oynat"}
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-white/70 bg-black/30 text-white backdrop-blur transition hover:scale-105 hover:bg-white hover:text-black"
              onClick={(event) => {
                event.stopPropagation();
                playItem();
              }}
              onPointerDown={(event) => event.stopPropagation()}
              type="button"
            >
              {playing ? (
                <Pause className="size-5 fill-current" />
              ) : (
                <Play className="ml-0.5 size-5 fill-current" />
              )}
            </button>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-white sm:text-xl">
                {item.title}
              </h2>

              {artistHref ? (
                <Link
                  className="mt-1 block truncate text-sm text-white/65 hover:text-white"
                  href={artistHref}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  {item.artistName}
                </Link>
              ) : (
                <p className="mt-1 truncate text-sm text-white/65">
                  {item.artistName}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 text-white">
            <button
              aria-label="Beğen"
              className="inline-flex h-10 items-center gap-2 rounded-full px-3 transition hover:bg-white/10"
              onClick={(event) => {
                event.stopPropagation();
                void likeItem();
              }}
              onPointerDown={(event) => event.stopPropagation()}
              type="button"
            >
              <Heart
                className={`size-5 ${
                  liked ? "fill-[#ff665a] text-[#ff665a]" : ""
                }`}
              />
              <span className="text-sm font-semibold">{likeCount}</span>
            </button>

            <button
              aria-label="Yorumları aç"
              className="inline-flex h-10 items-center gap-2 rounded-full px-3 transition hover:bg-white/10"
              onClick={(event) => {
                event.stopPropagation();
                setCommentsOpen((current) => !current);
              }}
              onPointerDown={(event) => event.stopPropagation()}
              type="button"
            >
              <MessageCircle className="size-5" />
              <span className="hidden text-sm font-semibold sm:inline">
                Yorum
              </span>
            </button>

            <button
              aria-label="Diğer seçenekler"
              className="inline-flex size-10 items-center justify-center rounded-full transition hover:bg-white/10"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              type="button"
            >
              <MoreVertical className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {commentsOpen ? (
        <div
          className="border-t border-white/10 bg-[#11151b] p-5"
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Yorumlar</h3>
              <p className="mt-1 text-xs text-white/50">
                Bu şarkı hakkındaki düşünceni paylaş.
              </p>
            </div>

            <button
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white"
              onClick={() => setCommentsOpen(false)}
              type="button"
            >
              Kapat
            </button>
          </div>

          <DiscoverCommentForm
            externalMediaId={item.externalMediaId}
            isAuthenticated={isAuthenticated}
            loginHref="/sign-in?next=/discover"
            releaseId={item.releaseId}
            trackId={item.trackId}
          />
        </div>
      ) : null}
    </article>
  );
}
