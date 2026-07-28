"use client";

import { useState } from "react";

import { DiscoverFeedCard } from "@/features/growth/components/discover-feed-card";
import { GlobalPlayer } from "@/features/growth/components/global-player";
import type { DiscoverFeedItem } from "@/features/growth/server/services/discover.service";
import {
  playerCapabilities,
  type PlayerItem,
} from "@/features/player/domain/player-source";

type DiscoverFeedClientProps = {
  feed: DiscoverFeedItem[];
};

export function DiscoverFeedClient({
  feed,
}: DiscoverFeedClientProps) {
  const [currentItem, setCurrentItem] =
    useState<PlayerItem | null>(null);

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
      <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {feed.map((item, index) => (
          <DiscoverFeedCard
            item={item}
            key={item.id}
            onPlay={playRadaruneItem}
            rank={index + 1}
          />
        ))}
      </section>

      {currentItem ? (
  <GlobalPlayer item={currentItem} />
) : (
  <GlobalPlayer />
)}
    </>
  );
}
