/* eslint-disable @next/next/no-img-element -- Artwork is served by the runtime storage route. */
"use client";

import { useState } from "react";

type PublicArtworkImageProps = {
  src: string;
  alt: string;
  fallbackLabel?: string;
  className?: string;
  loading?: "eager" | "lazy";
};

export function PublicArtworkImage({
  src,
  alt,
  fallbackLabel = "Kapak görseli kullanılamıyor",
  className,
  loading = "lazy",
}: PublicArtworkImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className ?? ""} grid place-items-center bg-gradient-to-br from-emerald-200 to-slate-900`}
      >
        <span className="px-6 text-center text-sm font-medium text-white/80">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
