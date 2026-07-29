"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

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
  const [dragX, setDragX] = useState(0);
  const dragStart = useRef<number | null>(null);

  const activeItem = feed[activeIndex] ?? null;

  function nextItem() {
    setActiveIndex((index) => (feed.length ? (index + 1) % feed.length : 0));
    setDragX(0);
  }

  function previousItem() {
    setActiveIndex((index) =>
      feed.length ? (index - 1 + feed.length) % feed.length : 0,
    );
    setDragX(0);
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
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragStart.current === null) return;
    setDragX(event.clientX - dragStart.current);
  }

  function pointerUp() {
    if (dragStart.current === null) return;
    const distance = dragX;
    dragStart.current = null;
    if (distance > 90) previousItem();
    else if (distance < -90) nextItem();
    else setDragX(0);
  }

  function playRadaruneItem(item: DiscoverFeedItem) {
    if (
      item.sourceType !== "RADARUNE" ||
      !item.trackId
    ) {
      return;
    }

    setCurrentItem({
      id: item.trackId,
      title: item.title,
      artistName: item.artistName,
      source: "RADARUNE_AUDIO",
      sourceLabel: "Radarune",
      playbackUrl: `/api/growth/tracks/${item.trackId}/stream`,
      embedUrl: null,
      capabilities:
        playerCapabilities.RADARUNE_AUDIO,
    });
  }

  return (
    <>
      <section className="mt-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex items-center justify-between text-sm text-muted">
            <span className="font-semibold uppercase tracking-[0.16em] text-accent">Sana özel akış</span>
            <span>{feed.length ? `${activeIndex + 1} / ${feed.length}` : "0 içerik"}</span>
          </div>

          {activeItem ? (
            <div
              className="touch-pan-y select-none transition-transform duration-200 ease-out"
              onPointerDown={pointerDown}
              onPointerMove={pointerMove}
              onPointerUp={pointerUp}
              onPointerCancel={pointerUp}
              style={{
                transform: `translateX(${dragX}px) rotate(${dragX * 0.035}deg)`,
              }}
            >
              <DiscoverFeedCard
                item={activeItem}
                onPlay={playRadaruneItem}
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
                onClick={previousItem}
                type="button"
                aria-label="Önceki içerik"
              >
                ↶
              </button>
              <button
                className="rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
                onClick={nextItem}
                type="button"
              >
                Sıradaki içerik
              </button>
              <button
                className="inline-flex size-12 items-center justify-center rounded-full border border-line bg-surface text-xl text-muted shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-500"
                onClick={nextItem}
                type="button"
                aria-label="Sonraki içerik"
              >
                ↷
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
