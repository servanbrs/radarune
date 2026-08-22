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

  return <button className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/45 px-3 py-2 text-xs font-semibold text-[#101817] shadow-sm transition hover:border-black/20 hover:bg-white/75" onClick={() => void share()} type="button">{copied ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}{copied ? "Kopyalandı" : "Profili paylaş"}</button>;
}
