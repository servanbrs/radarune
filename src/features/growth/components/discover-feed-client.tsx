"use client";

import Link from "next/link";
import {
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  Heart,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";

import { DiscoverFeedCard } from "@/features/growth/components/discover-feed-card";
import { useGlobalPlayer } from "@/features/growth/components/global-player-provider";
import type { DiscoverFeedItem } from "@/features/growth/server/services/discover.service";
import {
  playerCapabilities,
  type PlayerItem,
} from "@/features/player/domain/player-source";

type DiscoverFeedClientProps = {
  feed: DiscoverFeedItem[];
  isAuthenticated?: boolean;
};

function stableSortKey(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function providerEmbedUrl(
  provider: string,
  externalUrl: string | null,
  embedUrl: string | null,
) {
  if (embedUrl) return embedUrl;
  if (!externalUrl) return null;

  try {
    const parsed = new URL(externalUrl);

    if (provider === "YOUTUBE") {
      const pathParts = parsed.pathname.split("/").filter(Boolean);

      const videoId = parsed.hostname.includes("youtu.be")
        ? pathParts[0]
        : (parsed.searchParams.get("v") ??
          (pathParts[0] === "embed" || pathParts[0] === "shorts"
            ? pathParts[1]
            : null));

      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (provider === "SPOTIFY") {
      const parts = parsed.pathname.split("/").filter(Boolean);

      return parts.length >= 2
        ? `https://open.spotify.com/embed/${parts[0]}/${parts[1]}`
        : null;
    }
  } catch {
    return null;
  }

  return null;
}

function artworkUrl(item: DiscoverFeedItem | null) {
  if (!item) return null;

  if (item.sourceType === "RADARUNE" && item.releaseId) {
    return `/api/public/v1/releases/${item.releaseId}/artwork`;
  }

  return item.thumbnailUrl;
}

export function DiscoverFeedClient({
  feed,
  isAuthenticated = false,
}: DiscoverFeedClientProps) {
  const { play } = useGlobalPlayer();

  const [activeIndex, setActiveIndex] = useState(0);

  const [sortMode, setSortMode] = useState<"recommended" | "votes">(
    "recommended",
  );

  const [inlinePlayingId, setInlinePlayingId] = useState<string | null>(null);

  const [randomOrder] = useState(() =>
    [...feed]
      .sort((left, right) => stableSortKey(left.id) - stableSortKey(right.id))
      .map((item) => item.id),
  );

  const [drag, setDrag] = useState({
    x: 0,
    y: 0,
  });

  const dragStart = useRef<number | null>(null);

  const dragStartY = useRef<number | null>(null);

  const visibleFeed = useMemo(() => {
    if (sortMode === "recommended") {
      const rank = new Map(randomOrder.map((id, index) => [id, index]));

      return [...feed].sort(
        (left, right) =>
          (rank.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
          (rank.get(right.id) ?? Number.MAX_SAFE_INTEGER),
      );
    }

    return [...feed].sort(
      (left, right) =>
        (right.likeCount ?? 0) - (left.likeCount ?? 0) ||
        right.score - left.score,
    );
  }, [feed, randomOrder, sortMode]);

  const activeItem = visibleFeed[activeIndex] ?? null;

  const activeArtwork = artworkUrl(activeItem);

  const recordTrackEvent = useCallback(
    async (trackId: string, eventType: "IMPRESSION" | "PLAY") => {
      if (!isAuthenticated) return;

      try {
        await fetch("/api/growth/discover/events", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            trackId,
            eventType,
          }),
          keepalive: true,
        });
      } catch {
        // Akış analytics kesintisinde çalışmaya devam eder.
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    if (activeItem?.trackId) {
      void recordTrackEvent(activeItem.trackId, "IMPRESSION");
    }
  }, [activeItem?.trackId, recordTrackEvent]);

  function nextItem() {
    setActiveIndex((index) =>
      visibleFeed.length ? (index + 1) % visibleFeed.length : 0,
    );

    setDrag({ x: 0, y: 0 });
    setInlinePlayingId(null);
  }

  function previousItem() {
    setActiveIndex((index) =>
      visibleFeed.length
        ? (index - 1 + visibleFeed.length) % visibleFeed.length
        : 0,
    );

    setDrag({ x: 0, y: 0 });
    setInlinePlayingId(null);
  }

  async function voteAndNext() {
    if (!activeItem) return;

    if (!isAuthenticated) {
      window.location.assign("/sign-in?next=/discover");
      return;
    }

    const payload = activeItem.trackId
      ? {
          trackId: activeItem.trackId,
        }
      : activeItem.releaseId
        ? {
            releaseId: activeItem.releaseId,
          }
        : {
            externalMediaId: activeItem.externalMediaId,
          };

    try {
      await fetch("/api/growth/like", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      // Oylama kesintisinde akış devam eder.
    }

    nextItem();
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;

      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        void voteAndNext();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        nextItem();
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        nextItem();
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        previousItem();
      }

      if (event.code === "Space" && activeItem) {
        event.preventDefault();
        playItem(activeItem);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    dragStart.current = event.clientX;
    dragStartY.current = event.clientY;

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragStart.current === null || dragStartY.current === null) {
      return;
    }

    setDrag({
      x: event.clientX - dragStart.current,
      y: event.clientY - dragStartY.current,
    });
  }

  function pointerUp() {
    if (dragStart.current === null) return;

    const distanceX = drag.x;
    const distanceY = drag.y;

    dragStart.current = null;
    dragStartY.current = null;

    if (Math.abs(distanceX) > Math.abs(distanceY) && distanceX > 90) {
      void voteAndNext();
    } else if (Math.abs(distanceX) > Math.abs(distanceY) && distanceX < -90) {
      nextItem();
    } else if (Math.abs(distanceY) > 90) {
      nextItem();
    } else {
      setDrag({ x: 0, y: 0 });
    }
  }

  function toPlayerItem(item: DiscoverFeedItem): PlayerItem | null {
    if (item.sourceType === "RADARUNE") {
      if (!item.trackId) return null;

      return {
        id: item.trackId,
        title: item.title,
        artistName: item.artistName,
        source: "RADARUNE_AUDIO",
        sourceLabel: "Radarune",
        playbackUrl: `/api/public/v1/tracks/${item.trackId}/stream`,
        embedUrl: null,
        capabilities: playerCapabilities.RADARUNE_AUDIO,
      };
    }

    if (item.provider === "YOUTUBE" || item.provider === "SPOTIFY") {
      return {
        id: item.externalMediaId,
        title: item.title,
        artistName: item.artistName,
        source: item.provider === "YOUTUBE" ? "YOUTUBE" : "SPOTIFY_EMBED",
        sourceLabel: item.provider === "YOUTUBE" ? "YouTube" : "Spotify",
        playbackUrl: null,
        embedUrl: providerEmbedUrl(
          item.provider,
          item.externalUrl,
          item.embedUrl,
        ),
        externalUrl: item.externalUrl,
        capabilities:
          playerCapabilities[
            item.provider === "YOUTUBE" ? "YOUTUBE" : "SPOTIFY_EMBED"
          ],
      };
    }

    return null;
  }

  function playItem(item: DiscoverFeedItem) {
    const playerItem = toPlayerItem(item);

    if (!playerItem) return;

    if (item.trackId) {
      void recordTrackEvent(item.trackId, "PLAY");
    }

    const playerQueue = visibleFeed
      .map(toPlayerItem)
      .filter((value): value is PlayerItem => Boolean(value));

    play(playerItem, playerQueue);
  }

  function playInline(item: DiscoverFeedItem) {
    setInlinePlayingId(item.id);
  }

  useEffect(() => {
    if (!activeItem) return;

    if (activeItem.provider === "YOUTUBE") {
      return;
    }

    if (
      activeItem.sourceType === "RADARUNE" &&
      activeItem.playable &&
      activeItem.trackId
    ) {
      playItem(activeItem);
    }

    // Kart değişikliği autoplay tetikleyicisidir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem?.id]);

  return (
    <div className="relative mx-auto max-w-[1320px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[8%] top-20 h-[680px] overflow-hidden rounded-[5rem] opacity-30 blur-[85px]"
      >
        {activeArtwork ? (
          <div
            className="absolute inset-0 scale-125 bg-cover bg-center transition-all duration-700"
            style={{
              backgroundImage: `url("${activeArtwork}")`,
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-blue-500" />
        )}
      </div>

      <div className="relative mb-8 flex flex-col items-center justify-between gap-5 lg:flex-row">
        <div>
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-700 lg:text-left">
            Sana özel akış
          </p>

          <p className="mt-2 text-center text-sm text-[#65706e] lg:text-left">
            {activeIndex + 1} / {visibleFeed.length} içerik
          </p>
        </div>

        <div className="inline-flex rounded-2xl border border-black/[0.07] bg-white/80 p-1.5 shadow-lg backdrop-blur-xl">
          <button
            className={[
              "rounded-xl px-5 py-2.5 text-sm font-semibold transition",
              sortMode === "recommended"
                ? "bg-[#101817] text-white shadow-md"
                : "text-[#65706e] hover:text-[#101817]",
            ].join(" ")}
            onClick={() => {
              setSortMode("recommended");
              setActiveIndex(0);
            }}
            type="button"
          >
            Sana özel
          </button>

          <button
            className={[
              "rounded-xl px-5 py-2.5 text-sm font-semibold transition",
              sortMode === "votes"
                ? "bg-emerald-500 text-white shadow-md"
                : "text-[#65706e] hover:text-[#101817]",
            ].join(" ")}
            onClick={() => {
              setSortMode("votes");
              setActiveIndex(0);
            }}
            type="button"
          >
            Trend
          </button>
        </div>
      </div>

      <div className="relative grid items-start gap-7 xl:grid-cols-[120px_minmax(0,650px)_minmax(280px,1fr)] xl:justify-center">
        <aside className="order-2 hidden flex-col items-center gap-3 pt-24 xl:flex">
          <button
            aria-label="Önceki içerik"
            className="inline-flex size-12 items-center justify-center rounded-full border border-black/[0.07] bg-white/80 text-[#52605d] shadow-lg backdrop-blur transition hover:-translate-y-1 hover:text-[#101817]"
            onClick={previousItem}
            type="button"
          >
            <ChevronLeft className="size-5" />
          </button>

          <button
            aria-label="Sonraki içerik"
            className="inline-flex size-12 items-center justify-center rounded-full border border-black/[0.07] bg-white/80 text-[#52605d] shadow-lg backdrop-blur transition hover:-translate-y-1 hover:text-[#101817]"
            onClick={nextItem}
            type="button"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="my-2 h-16 w-px bg-black/10" />

          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b9693] [writing-mode:vertical-rl]">
            Kaydır ve keşfet
          </span>
        </aside>

        <div className="order-1 min-w-0">
          {activeItem ? (
            <div
              className="touch-none select-none transition-[transform,filter,opacity] duration-300 ease-out will-change-transform"
              onPointerCancel={pointerUp}
              onPointerDown={pointerDown}
              onPointerMove={pointerMove}
              onPointerUp={pointerUp}
              style={{
                transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x * 0.028}deg)`,
                opacity: Math.max(0.72, 1 - Math.abs(drag.x) / 700),
              }}
            >
              <DiscoverFeedCard
                inlinePlaying={
                  inlinePlayingId === activeItem.id ||
                  activeItem.provider === "YOUTUBE"
                }
                isAuthenticated={isAuthenticated}
                item={activeItem}
                onInlinePlay={playInline}
                onPlay={playItem}
                rank={activeIndex + 1}
              />
            </div>
          ) : (
            <div className="rounded-[2rem] border border-black/10 bg-white/80 p-12 text-center text-muted shadow-xl">
              Henüz keşfedilecek içerik yok.
            </div>
          )}

          {activeItem ? (
            <div className="mt-7 flex items-center justify-center gap-3">
              <button
                aria-label="Beğenme ve geç"
                className="inline-flex size-14 items-center justify-center rounded-full border border-red-500/15 bg-white/85 text-red-500 shadow-xl backdrop-blur transition hover:-translate-y-1 hover:bg-red-500 hover:text-white"
                onClick={nextItem}
                type="button"
              >
                <X className="size-5" />
              </button>

              <button
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-black/[0.07] bg-white/85 px-7 text-sm font-semibold text-[#101817] shadow-xl backdrop-blur transition hover:-translate-y-1"
                onClick={nextItem}
                type="button"
              >
                <ArrowDown className="size-4" />
                Sonraki
              </button>

              <button
                aria-label="Beğen"
                className="inline-flex size-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_18px_50px_rgba(16,185,129,0.35)] transition hover:-translate-y-1 hover:scale-105"
                onClick={() => void voteAndNext()}
                type="button"
              >
                <Heart className="size-5 fill-current" />
              </button>
            </div>
          ) : null}
        </div>

        {activeItem ? (
          <aside className="order-3 space-y-4 xl:pt-10">
            <article className="rounded-[1.75rem] border border-black/[0.07] bg-white/80 p-6 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#101817] text-white">
                  <Sparkles className="size-5" />
                </div>

                <span className="rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-600">
                  Radarune Score
                </span>
              </div>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-[-0.06em] text-[#101817]">
                  {Math.round(activeItem.score)}
                </span>

                <span className="pb-1 text-sm text-[#8b9693]">/ 100</span>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-orange-400 transition-all duration-700"
                  style={{
                    width: `${Math.max(5, Math.min(100, activeItem.score))}%`,
                  }}
                />
              </div>

              <p className="mt-4 text-sm leading-6 text-[#65706e]">
                Topluluk ilgisi, tazelik ve keşif sinyallerine göre hesaplanan
                içerik skoru.
              </p>
            </article>

            <article className="rounded-[1.75rem] border border-black/[0.07] bg-[#101817] p-6 text-white shadow-xl">
              <div className="flex items-center gap-2 text-emerald-300">
                <Flame className="size-4" />

                <span className="text-xs font-bold uppercase tracking-[0.18em]">
                  Şimdi keşfediliyor
                </span>
              </div>

              <h3 className="mt-5 line-clamp-2 text-2xl font-semibold tracking-[-0.04em]">
                {activeItem.title}
              </h3>

              <p className="mt-2 truncate text-sm text-white/50">
                {activeItem.artistName}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/[0.06] p-4">
                  <p className="text-xs text-white/40">Tür</p>

                  <p className="mt-1 truncate text-sm font-semibold">
                    {activeItem.primaryGenre}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.06] p-4">
                  <p className="text-xs text-white/40">Beğeni</p>

                  <p className="mt-1 text-sm font-semibold">
                    {activeItem.likeCount ?? 0}
                  </p>
                </div>
              </div>
            </article>

            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-black/[0.07] bg-white/80 px-5 py-4 text-sm font-semibold text-[#52605d] shadow-lg backdrop-blur transition hover:text-[#101817]"
              onClick={() => {
                setActiveIndex(0);
                setSortMode("recommended");
              }}
              type="button"
            >
              <RotateCcw className="size-4" />
              Akışı başa al
            </button>
          </aside>
        ) : null}
      </div>

      {!isAuthenticated ? (
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-black/[0.07] bg-white/80 p-5 text-center text-sm text-[#65706e] shadow-lg backdrop-blur">
          Beğenme, yorum ve kaydetme özellikleri için{" "}
          <Link className="font-semibold text-emerald-700" href="/sign-in">
            giriş yapın
          </Link>
          .
        </div>
      ) : null}
    </div>
  );
}
