"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Headphones,
  MessageCircle,
  Music2,
  Play,
} from "lucide-react";

import type { DiscoverFeedItem } from "@/features/growth/server/services/discover.service";
import { DiscoverLikeButton } from "@/features/growth/components/discover-like-button";
import { DiscoverCommentForm } from "@/features/growth/components/discover-comment-form";
import { DiscoverSaveButton } from "@/features/growth/components/discover-save-button";
import { DiscoverArtistFollowButton } from "@/features/growth/components/discover-artist-follow-button";

type DiscoverFeedCardProps = {
  item: DiscoverFeedItem;
  rank: number;
  onPlay?: (item: DiscoverFeedItem) => void;
  inlinePlaying?: boolean;
  onInlinePlay?: (item: DiscoverFeedItem) => void;
  isAuthenticated?: boolean;
};

const dateFormatter = new Intl.DateTimeFormat(
  "tr-TR",
  {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
);

function sourceLabel(item: DiscoverFeedItem) {
  if (item.provider === "RADARUNE") {
    return "Radarune";
  }

  if (item.provider === "YOUTUBE") {
    return "YouTube";
  }

  return "Spotify";
}

function youtubeEmbedUrl(item: DiscoverFeedItem) {
  if (item.provider !== "YOUTUBE") return null;
  if (item.embedUrl) {
    try {
      const parsed = new URL(item.embedUrl);
      parsed.searchParams.set("autoplay", "1");
      parsed.searchParams.set("rel", "0");
      parsed.searchParams.set("mute", "1");
      parsed.searchParams.set("playsinline", "1");
      return parsed.toString();
    } catch {
      return item.embedUrl;
    }
  }
  if (!item.externalUrl) return null;

  try {
    const parsed = new URL(item.externalUrl);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const videoId = parsed.hostname.includes("youtu.be")
      ? parts[0]
      : parsed.searchParams.get("v") ??
        (parts[0] === "embed" || parts[0] === "shorts" ? parts[1] : null);
    return videoId
      ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&mute=1&playsinline=1`
      : null;
  } catch {
    return null;
  }
}

export function DiscoverFeedCard({
  item,
  rank,
  onPlay,
  inlinePlaying = false,
  onInlinePlay,
  isAuthenticated = false,
}: DiscoverFeedCardProps) {
  const radaruneArtworkUrl =
    item.sourceType === "RADARUNE" &&
    item.releaseId
      ? `/api/public/v1/releases/${item.releaseId}/artwork`
      : null;

  const thumbnailUrl =
    radaruneArtworkUrl ?? item.thumbnailUrl;

  const youtubeUrl = youtubeEmbedUrl(item);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likeCount ?? 0);

  const targetProps = {
    externalMediaId: item.externalMediaId,
    releaseId: item.releaseId,
    trackId: item.trackId,
  };

  return (
    <article className="group mx-auto w-full max-w-[34rem] overflow-hidden rounded-[2rem] border border-line bg-surface shadow-[0_24px_80px_rgba(19,19,19,0.14)]">
      <div
        className="relative aspect-[4/5] overflow-hidden bg-[#101a1a] sm:aspect-[4/5]"
        onClick={() => {
          if (youtubeUrl && !inlinePlaying) onInlinePlay?.(item);
          else if (!youtubeUrl) onPlay?.(item);
        }}
        role={youtubeUrl || item.playable ? "button" : undefined}
        tabIndex={youtubeUrl || item.playable ? 0 : undefined}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (youtubeUrl && !inlinePlaying) onInlinePlay?.(item);
            else if (!youtubeUrl) onPlay?.(item);
          }
        }}
      >
        {inlinePlaying && youtubeUrl ? (
          <iframe
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 z-20 h-full w-full"
            src={youtubeUrl}
            title={`${item.title} YouTube videosu`}
          />
        ) : null}
        {inlinePlaying && youtubeUrl ? (
          <div className="pointer-events-none absolute inset-0 z-30">
            <div className="pointer-events-auto absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
              <div className="min-w-0 text-white drop-shadow-lg">
                {item.artist ? (
                  <Link className="inline-flex max-w-full items-center gap-2 text-sm font-semibold hover:underline" href={`/artist/${item.artist.slug}`}>
                    <span className="truncate">{item.artist.name}</span>
                    <ArrowUpRight className="size-4 shrink-0" />
                  </Link>
                ) : <p className="truncate text-sm font-semibold">{item.artistName}</p>}
                <p className="mt-1 line-clamp-2 text-lg font-semibold">{item.title}</p>
              </div>

              <div className="flex shrink-0 flex-col items-center gap-2 text-white">
                {isAuthenticated ? (
                  <DiscoverLikeButton
                    {...targetProps}
                    onLiked={() => setLikeCount((count) => count + 1)}
                    variant="overlay"
                  />
                ) : (
                  <Link aria-label="Beğenmek için giriş yapın" className="inline-flex size-12 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white backdrop-blur" href="/sign-in?next=/discover">
                    <span aria-hidden="true" className="text-xl">♡</span>
                  </Link>
                )}
                <span className="text-xs font-semibold drop-shadow">{likeCount} beğeni</span>
                <button
                  aria-label="Yorumları aç"
                  className="inline-flex size-12 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
                  onClick={(event) => { event.stopPropagation(); setCommentsOpen((open) => !open); }}
                  type="button"
                >
                  <MessageCircle className="size-5" />
                </button>
                <span className="text-xs font-semibold drop-shadow">Yorum</span>
              </div>
            </div>
          </div>
        ) : null}
        {!inlinePlaying && thumbnailUrl ? (
          <Image
            alt={`${item.title} kapak görseli`}
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            src={thumbnailUrl}
            // Provider thumbnails are user/content supplied URLs (YouTube,
            // Spotify, CDN mirrors). Avoid a brittle host allow-list and let
            // the browser load the image directly.
            unoptimized
          />
        ) : !inlinePlaying ? (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(15,118,110,0.8),transparent_35%),radial-gradient(circle_at_80%_75%,rgba(255,147,87,0.45),transparent_38%),linear-gradient(145deg,#111827,#102523)]" />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/20" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            #{rank}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            {item.provider === "RADARUNE" ? (
              <BadgeCheck className="size-3.5 text-emerald-300" />
            ) : (
              <Headphones className="size-3.5" />
            )}

            {sourceLabel(item)}
          </span>
        </div>

        {!inlinePlaying && item.sourceType === "RADARUNE" &&
        item.playable &&
        item.trackId ? (
          <button
            aria-label={`${item.title} parçasını çal`}
            className="absolute left-1/2 top-1/2 z-10 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white text-black shadow-2xl transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={(event) => { event.stopPropagation(); onPlay?.(item); }}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            type="button"
          >
            <Play className="ml-1 size-6 fill-current" />
          </button>
        ) : null}

        {!inlinePlaying && item.sourceType === "EXTERNAL" && (youtubeUrl || item.embedUrl || item.playable) ? (
          <button
            aria-label={`${item.title} içeriğini oynat`}
            className="absolute left-1/2 top-1/2 z-10 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white text-black shadow-2xl transition hover:scale-105"
            onClick={(event) => { event.stopPropagation(); if (youtubeUrl) onInlinePlay?.(item); else onPlay?.(item); }}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            type="button"
          >
            <Play className="ml-1 size-6 fill-current" />
          </button>
        ) : null}

        {!inlinePlaying ? <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="line-clamp-2 text-2xl font-semibold leading-tight text-white">
            {item.title}
          </p>

          <p className="mt-2 truncate text-sm text-white/65">
            {item.artistName}
          </p>
        </div> : null}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {item.primaryGenre}
            </p>

            <p className="mt-1 text-xs text-muted">
              {item.publishedAt
                ? dateFormatter.format(
                    new Date(item.publishedAt),
                  )
                : "Yayın tarihi belirtilmedi"}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
            Skor {Math.round(item.score)}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-background/70 px-4 py-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
            {item.artistName.trim().slice(0, 1).toUpperCase() || "R"}
          </div>
          {item.artist ? (
            <Link className="min-w-0 flex-1" href={`/artist/${item.artist.slug}`}>
              <p className="truncate text-sm font-semibold text-foreground">{item.artist.name}</p>
              <p className="text-xs text-muted">Sanatçı profili · {sourceLabel(item)}</p>
            </Link>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{item.artistName}</p>
              <p className="text-xs text-muted">{sourceLabel(item)} sanatçı profili</p>
            </div>
          )}
          {item.artist ? <DiscoverArtistFollowButton artistId={item.artist.id} isAuthenticated={isAuthenticated} /> : null}
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
          {!isAuthenticated ? <Link className="rounded-full border border-line px-3 py-2 text-xs font-semibold text-muted" href="/sign-in?next=/discover">Etkileşim için giriş</Link> : null}
          {isAuthenticated && item.sourceType === "RADARUNE" && item.trackId ? <DiscoverSaveButton trackId={item.trackId} /> : null}
          {item.sourceType === "RADARUNE" ? (
            <button
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                !item.playable || !item.trackId
              }
              onClick={(event) => { event.stopPropagation(); onPlay?.(item); }}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              type="button"
            >
              <Play className="size-4 fill-current" />
              Radarune&apos;da dinle
            </button>
          ) : (
            <button
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-line bg-background px-4 py-3 text-sm font-semibold text-muted transition hover:border-accent hover:text-accent"
              onClick={() => setCommentsOpen((open) => !open)}
              type="button"
            >
              <MessageCircle className="size-4" />
              Yorumlar ve etkileşim
            </button>
          )}

          {item.sourceType === "RADARUNE" &&
          item.artist ? (
            <Link
              aria-label={`${item.artistName} sanatçı profilini aç`}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-background text-foreground"
              href={`/artist/${item.artist.slug}`}
            >
              <Music2 className="size-4" />
            </Link>
          ) : null}

          {item.sourceType === "RADARUNE" ? (
            <Link
              aria-label={`${item.title} yayınını aç`}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-background text-foreground"
              href={`/releases/${item.releaseId}`}
            >
              <ArrowUpRight className="size-4" />
            </Link>
          ) : null}
        </div>
        {commentsOpen && (item.trackId || item.releaseId || item.externalMediaId) ? (
          <DiscoverCommentForm
            externalMediaId={item.externalMediaId}
            isAuthenticated={isAuthenticated}
            loginHref="/sign-in?next=/discover"
            releaseId={item.releaseId}
            trackId={item.trackId}
          />
        ) : null}
      </div>
    </article>
  );
}
