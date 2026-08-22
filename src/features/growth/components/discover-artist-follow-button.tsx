"use client";

import { UserMinus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DiscoverArtistFollowButton({
  artistId,
  isAuthenticated,
  initialFollowing = false,
}: {
  artistId: string;
  isAuthenticated: boolean;
  initialFollowing?: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleFollow() {
    if (pending) return;
    if (!isAuthenticated) {
      const next = `${window.location.pathname}${window.location.search}`;
      router.push(`/sign-in?next=${encodeURIComponent(next)}`);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/growth/follow", {
        method: following ? "DELETE" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ artistId }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error ?? "Takip işlemi tamamlanamadı.");
        return;
      }
      setFollowing((value) => !value);
    } catch {
      setError("Bağlantı kurulamadı. Lütfen tekrar deneyin.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        aria-label={following ? "Sanatçıyı takipten çıkar" : "Sanatçıyı takip et"}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        onClick={(event) => { event.preventDefault(); event.stopPropagation(); void toggleFollow(); }}
        type="button"
      >
        {following ? <UserMinus className="size-3.5" /> : <UserPlus className="size-3.5" />}
        {following ? "Takipten çık" : "Takip et"}
      </button>
      {error ? <span className="max-w-48 text-[11px] font-medium text-red-700">{error}</span> : null}
    </span>
  );
}
