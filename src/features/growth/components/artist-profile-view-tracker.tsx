"use client";

import { useEffect } from "react";

export function ArtistProfileViewTracker({ artistId }: { artistId: string }) {
  useEffect(() => {
    void fetch(`/api/growth/artists/${encodeURIComponent(artistId)}/view`, {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: "{}",
    }).catch(() => undefined);
  }, [artistId]);

  return null;
}
