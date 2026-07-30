"use client";

import { Check, UserPlus } from "lucide-react";
import { useState } from "react";

export function DiscoverArtistFollowButton({
  artistId,
  isAuthenticated,
}: {
  artistId: string;
  isAuthenticated: boolean;
}) {
  const [following, setFollowing] = useState(false);
  const [pending, setPending] = useState(false);

  if (!isAuthenticated) return null;

  async function toggleFollow() {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/growth/follow", {
        method: following ? "DELETE" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ artistId }),
      });
      if (response.ok) setFollowing((value) => !value);
    } catch {
      // Keep the current follow state when the request is interrupted.
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      aria-label={following ? "Sanatçıyı takipten çıkar" : "Sanatçıyı takip et"}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60"
      disabled={pending}
      onClick={(event) => { event.preventDefault(); event.stopPropagation(); void toggleFollow(); }}
      type="button"
    >
      {following ? <Check className="size-3.5" /> : <UserPlus className="size-3.5" />}
      {following ? "Takipte" : "Takip et"}
    </button>
  );
}
