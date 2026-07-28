"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Headphones,
  Music2,
  Play,
} from "lucide-react";

import type { DiscoverFeedItem } from "@/features/growth/server/services/discover.service";

type DiscoverFeedCardProps = {
  item: DiscoverFeedItem;
  rank: number;
  onPlay?: (item: DiscoverFeedItem) => void;
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

export function DiscoverFeedCard({
  item,
  rank,
  onPlay,
}: DiscoverFeedCardProps) {
  const radaruneArtworkUrl =
    item.sourceType === "RADARUNE" &&
    item.releaseId
      ? `/api/growth/releases/${item.releaseId}/artwork`
      : null;

  const thumbnailUrl =
    radaruneArtworkUrl ?? item.thumbnailUrl;

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_18px_55px_rgba(19,19,19,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(19,19,19,0.12)]">
      <div className="relative aspect-square overflow-hidden bg-[#101a1a]">
        {thumbnailUrl ? (
          <Image
            alt={`${item.title} kapak görseli`}
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            src={thumbnailUrl}
            unoptimized={
              item.sourceType === "RADARUNE"
            }
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(15,118,110,0.8),transparent_35%),radial-gradient(circle_at_80%_75%,rgba(255,147,87,0.45),transparent_38%),linear-gradient(145deg,#111827,#102523)]" />
        )}

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

        {item.sourceType === "RADARUNE" &&
        item.playable &&
        item.trackId ? (
          <button
            aria-label={`${item.title} parçasını çal`}
            className="absolute left-1/2 top-1/2 z-10 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white text-black shadow-2xl transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onPlay?.(item)}
            type="button"
          >
            <Play className="ml-1 size-6 fill-current" />
          </button>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="line-clamp-2 text-2xl font-semibold leading-tight text-white">
            {item.title}
          </p>

          <p className="mt-2 truncate text-sm text-white/65">
            {item.artistName}
          </p>
        </div>
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

        {item.sourceType === "EXTERNAL" &&
        item.embedUrl ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-background">
            <iframe
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className={
                item.provider === "SPOTIFY"
                  ? "h-[152px] w-full"
                  : "aspect-video w-full"
              }
              loading="lazy"
              src={item.embedUrl}
              title={`${item.title} oynatıcı`}
            />
          </div>
        ) : null}

        <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
          {item.sourceType === "RADARUNE" ? (
            <button
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                !item.playable || !item.trackId
              }
              onClick={() => onPlay?.(item)}
              type="button"
            >
              <Play className="size-4 fill-current" />
              Radarune&apos;da dinle
            </button>
          ) : (
            <a
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-white"
              href={item.externalUrl ?? "#"}
              rel="noreferrer"
              target="_blank"
            >
              <Play className="size-4 fill-current" />
              Kaynakta dinle
            </a>
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
      </div>
    </article>
  );
}
