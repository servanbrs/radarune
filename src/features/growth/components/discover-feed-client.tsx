"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

import { DiscoverFeedCard } from "@/features/growth/components/discover-feed-card";
import { useGlobalPlayer } from "@/features/growth/components/global-player-provider";
import type { DiscoverFeedItem } from "@/features/growth/server/services/discover.service";
import Link from "next/link";
import {
  playerCapabilities,
  type PlayerItem,
} from "@/features/player/domain/player-source";

type DiscoverFeedClientProps = {
  feed: DiscoverFeedItem[];
  isAuthenticated?: boolean;
};

// The order must be identical during SSR and hydration. A seeded shuffle
// gives the feed a varied order without using Math.random() during render.
function stableSortKey(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function providerEmbedUrl(provider: string, externalUrl: string | null, embedUrl: string | null) {
  if (embedUrl) return embedUrl;
  if (!externalUrl) return null;
  try {
    const parsed = new URL(externalUrl);
    if (provider === "YOUTUBE") {
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      const videoId = parsed.hostname.includes("youtu.be")
        ? pathParts[0]
        : parsed.searchParams.get("v") ??
          (pathParts[0] === "embed" || pathParts[0] === "shorts" ? pathParts[1] : null);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (provider === "SPOTIFY") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      return parts.length >= 2 ? `https://open.spotify.com/embed/${parts[0]}/${parts[1]}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function DiscoverFeedClient({
  feed, isAuthenticated = false,
}: DiscoverFeedClientProps) {
  const { play } = useGlobalPlayer();
  const [activeIndex, setActiveIndex] = useState(0);
  const [sortMode, setSortMode] = useState<"recommended" | "votes">("recommended");
  const [inlinePlayingId, setInlinePlayingId] = useState<string | null>(null);
  const [randomOrder] = useState(() =>
    [...feed]
      .sort((left, right) => stableSortKey(left.id) - stableSortKey(right.id))
      .map((item) => item.id),
  );
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const dragStart = useRef<number | null>(null);
  const dragStartY = useRef<number | null>(null);

  const visibleFeed = useMemo(() => {
    if (sortMode === "recommended") {
      const rank = new Map(randomOrder.map((id, index) => [id, index]));
      return [...feed].sort((left, right) =>
        (rank.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(right.id) ?? Number.MAX_SAFE_INTEGER),
      );
    }
    return [...feed].sort((left, right) =>
      (right.likeCount ?? 0) - (left.likeCount ?? 0) || right.score - left.score,
    );
  }, [feed, randomOrder, sortMode]);

  const activeItem = visibleFeed[activeIndex] ?? null;

  const recordTrackEvent = useCallback(async (trackId: string, eventType: "IMPRESSION" | "PLAY") => {
    if (!isAuthenticated) return;
    try {
      await fetch("/api/growth/discover/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ trackId, eventType }),
        keepalive: true,
      });
    } catch {
      // Discovery remains usable when analytics is temporarily unavailable.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeItem?.trackId) void recordTrackEvent(activeItem.trackId, "IMPRESSION");
  }, [activeItem?.trackId, recordTrackEvent]);

  function nextItem() {
    setActiveIndex((index) => (visibleFeed.length ? (index + 1) % visibleFeed.length : 0));
    setDrag({ x: 0, y: 0 });
    setInlinePlayingId(null);
  }

  function previousItem() {
    setActiveIndex((index) =>
      visibleFeed.length ? (index - 1 + visibleFeed.length) % visibleFeed.length : 0,
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
      ? { trackId: activeItem.trackId }
      : activeItem.releaseId
        ? { releaseId: activeItem.releaseId }
        : { externalMediaId: activeItem.externalMediaId };

    try {
      await fetch("/api/growth/like", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Continue the feed even when voting is temporarily unavailable.
    }
    nextItem();
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextItem();
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") previousItem();
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
    if (dragStart.current === null || dragStartY.current === null) return;
    setDrag({ x: event.clientX - dragStart.current, y: event.clientY - dragStartY.current });
  }

  function pointerUp() {
    if (dragStart.current === null) return;
    const distanceX = drag.x;
    const distanceY = drag.y;
    dragStart.current = null;
    dragStartY.current = null;
    if (Math.abs(distanceX) > Math.abs(distanceY) && distanceX > 90) void voteAndNext();
    else if (Math.abs(distanceX) > Math.abs(distanceY) && distanceX < -90) nextItem();
    else if (distanceY < -90) nextItem();
    else if (distanceY > 90) nextItem();
    else setDrag({ x: 0, y: 0 });
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

    // Keep provider playback in the same persistent player surface. The
    // provider iframe is used when available; otherwise the player links to
    // the original source without pretending that an audio preview exists.
    if (item.provider === "YOUTUBE" || item.provider === "SPOTIFY") {
      return {
        id: item.externalMediaId,
        title: item.title,
        artistName: item.artistName,
        source: item.provider === "YOUTUBE" ? "YOUTUBE" : "SPOTIFY_EMBED",
        sourceLabel: item.provider === "YOUTUBE" ? "YouTube" : "Spotify",
        playbackUrl: null,
        embedUrl: providerEmbedUrl(item.provider, item.externalUrl, item.embedUrl),
        externalUrl: item.externalUrl,
        capabilities: playerCapabilities[item.provider === "YOUTUBE" ? "YOUTUBE" : "SPOTIFY_EMBED"],
      };
    }
    return null;
  }

  function playItem(item: DiscoverFeedItem) {
    const playerItem = toPlayerItem(item);
    if (!playerItem) return;
    if (item.trackId) void recordTrackEvent(item.trackId, "PLAY");
    const playerQueue = visibleFeed
      .map(toPlayerItem)
      .filter((value): value is PlayerItem => Boolean(value));
    play(playerItem, playerQueue);
  }

  function playInline(item: DiscoverFeedItem) {
    setInlinePlayingId(item.id);
  }

  // Start the selected card immediately. YouTube stays inside the swipe card
  // while Radarune audio uses the persistent player and survives navigation.
  useEffect(() => {
    if (!activeItem) return;
    if (activeItem.provider === "YOUTUBE") {
      return;
    }
    if (activeItem.sourceType === "RADARUNE" && activeItem.playable && activeItem.trackId) {
      playItem(activeItem);
    }
  // The id is intentional: changing the active card is the autoplay trigger.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem?.id]);

  return (
    <>
      <section className="mt-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <span className="font-semibold uppercase tracking-[0.16em] text-accent">Sana özel akış</span>
            <div className="inline-flex rounded-full border border-line bg-surface p-1 text-xs font-semibold">
              <button className={`rounded-full px-3 py-1.5 ${sortMode === "recommended" ? "bg-foreground text-white" : "text-muted"}`} onClick={() => { setSortMode("recommended"); setActiveIndex(0); }} type="button">Sana özel</button>
              <button className={`rounded-full px-3 py-1.5 ${sortMode === "votes" ? "bg-accent text-white" : "text-muted"}`} onClick={() => { setSortMode("votes"); setActiveIndex(0); }} type="button">En çok oylanan</button>
            </div>
          </div>

          {activeItem ? (
            <div
              className="touch-none select-none transition-transform duration-200 ease-out"
              onPointerDown={pointerDown}
              onPointerMove={pointerMove}
              onPointerUp={pointerUp}
              onPointerCancel={pointerUp}
              style={{
                transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x * 0.035}deg)`,
              }}
            >
              <DiscoverFeedCard
                item={activeItem}
                onPlay={playItem}
                inlinePlaying={inlinePlayingId === activeItem.id || activeItem.provider === "YOUTUBE"}
                onInlinePlay={playInline}
                rank={activeIndex + 1}
                isAuthenticated={isAuthenticated}
              />
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-line bg-surface p-10 text-center text-muted">
              Henüz keşfedilecek içerik yok.
            </div>
          )}

          {activeItem ? (
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                className="inline-flex size-12 items-center justify-center rounded-full border border-line bg-surface text-xl text-muted shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-500"
                onClick={nextItem}
                type="button"
                aria-label="Beğenme ve geç"
              >
                ✕
              </button>
              <button
                className="rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
                onClick={nextItem}
                type="button"
              >
                Aşağı geç
              </button>
              <button
                className="inline-flex size-12 items-center justify-center rounded-full border border-line bg-surface text-xl text-muted shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-500"
                onClick={() => void voteAndNext()}
                type="button"
                aria-label="Beğen"
              >
                ♥
              </button>
            </div>
          ) : null}

          {activeItem ? (
            <p className="mt-3 text-center text-xs font-medium text-muted">
              Sağa kaydır: beğen&nbsp; · &nbsp;Sola kaydır: beğenme&nbsp; · &nbsp;Aşağı kaydır: geç
            </p>
          ) : null}
        </div>
      </section>

      {!isAuthenticated ? <div className="mt-8 rounded-2xl border border-line bg-surface p-5 text-center text-sm text-muted">Beğenme, yorum ve kaydetme özellikleri için <Link className="font-semibold text-accent" href="/sign-in">giriş yapın</Link>.</div> : null}
    </>
  );
}
