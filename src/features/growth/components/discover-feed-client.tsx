"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

import { DiscoverFeedCard } from "@/features/growth/components/discover-feed-card";
import { GlobalPlayer } from "@/features/growth/components/global-player";
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

export function DiscoverFeedClient({
  feed, isAuthenticated = false,
}: DiscoverFeedClientProps) {
  const [currentItem, setCurrentItem] =
    useState<PlayerItem | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sortMode, setSortMode] = useState<"recommended" | "votes">("recommended");
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const dragStart = useRef<number | null>(null);
  const dragStartY = useRef<number | null>(null);

  const visibleFeed = useMemo(() => {
    if (sortMode === "recommended") return feed;
    return [...feed].sort((left, right) =>
      (right.likeCount ?? 0) - (left.likeCount ?? 0) || right.score - left.score,
    );
  }, [feed, sortMode]);

  const activeItem = visibleFeed[activeIndex] ?? null;

  function nextItem() {
    setActiveIndex((index) => (visibleFeed.length ? (index + 1) % visibleFeed.length : 0));
    setDrag({ x: 0, y: 0 });
  }

  function previousItem() {
    setActiveIndex((index) =>
      visibleFeed.length ? (index - 1 + visibleFeed.length) % visibleFeed.length : 0,
    );
    setDrag({ x: 0, y: 0 });
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

    await fetch("/api/growth/like", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
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
    else if (distanceY > 90) previousItem();
    else setDrag({ x: 0, y: 0 });
  }

  function playItem(item: DiscoverFeedItem) {
    if (item.sourceType === "RADARUNE") {
      if (!item.trackId) return;
      setCurrentItem({
        id: item.trackId,
        title: item.title,
        artistName: item.artistName,
        source: "RADARUNE_AUDIO",
        sourceLabel: "Radarune",
        playbackUrl: `/api/growth/tracks/${item.trackId}/stream`,
        embedUrl: null,
        capabilities: playerCapabilities.RADARUNE_AUDIO,
      });
      return;
    }

    // Keep provider playback in the same persistent player surface. The
    // provider iframe is used when available; otherwise the player links to
    // the original source without pretending that an audio preview exists.
    if (item.provider === "YOUTUBE" || item.provider === "SPOTIFY") {
      setCurrentItem({
        id: item.externalMediaId,
        title: item.title,
        artistName: item.artistName,
        source: item.provider === "YOUTUBE" ? "YOUTUBE" : "SPOTIFY_EMBED",
        sourceLabel: item.provider === "YOUTUBE" ? "YouTube" : "Spotify",
        playbackUrl: null,
        embedUrl: item.embedUrl ?? item.externalUrl,
        capabilities: playerCapabilities[item.provider === "YOUTUBE" ? "YOUTUBE" : "SPOTIFY_EMBED"],
      });
    }
  }

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
            <span>{visibleFeed.length ? `${activeIndex + 1} / ${visibleFeed.length}` : "0 içerik"}</span>
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
                Geç
              </button>
              <button
                className="inline-flex size-12 items-center justify-center rounded-full border border-line bg-surface text-xl text-muted shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-500"
                onClick={() => void voteAndNext()}
                type="button"
                aria-label="Sonraki içerik"
              >
                ♥
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {currentItem ? (
  <GlobalPlayer item={currentItem} />
) : (
  <GlobalPlayer />
      )}
      {!isAuthenticated ? <div className="mt-8 rounded-2xl border border-line bg-surface p-5 text-center text-sm text-muted">Beğenme, yorum ve kaydetme özellikleri için <Link className="font-semibold text-accent" href="/sign-in">giriş yapın</Link>.</div> : null}
    </>
  );
}
