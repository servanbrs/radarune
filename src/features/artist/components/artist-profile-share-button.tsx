"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function ArtistProfileShareButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/artist/${slug}`;
    if (navigator.share) {
      await navigator.share({ title: "Radarune sanatçı profili", url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <button className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20" onClick={() => void share()} type="button">{copied ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}{copied ? "Kopyalandı" : "Profili paylaş"}</button>;
}
