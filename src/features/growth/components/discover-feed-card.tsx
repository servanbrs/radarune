"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Maximize2,
  MessageCircle,
  Music2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";

import { DiscoverCommentForm } from "@/features/growth/components/discover-comment-form";
import { DiscoverArtistFollowButton } from "@/features/growth/components/discover-artist-follow-button";
import type { DiscoverFeedItem } from "@/features/growth/server/services/discover.service";

type DiscoverFeedCardProps = {
  item: DiscoverFeedItem;
  onPlay?: (item: DiscoverFeedItem) => void;
  inlinePlaying?: boolean;
  onInlinePlay?: (item: DiscoverFeedItem) => void;
  isAuthenticated?: boolean;
};

function youtubeVideoId(externalUrl: string | null, embedUrl: string | null) {
  const source = embedUrl || externalUrl;

  if (!source) {
    return null;
  }

  try {
    const parsed = new URL(source);
    const pathParts = parsed.pathname.split("/").filter(Boolean);

    if (parsed.hostname.includes("youtu.be")) {
      return pathParts[0] ?? null;
    }

    const queryId = parsed.searchParams.get("v");

    if (queryId) {
      return queryId;
    }

    if (pathParts[0] === "embed" || pathParts[0] === "shorts") {
      return pathParts[1] ?? null;
    }
  } catch {
    return null;
  }

  return null;
}

function spotifyEmbedUrl(externalUrl: string | null, embedUrl: string | null) {
  if (embedUrl) {
    return embedUrl;
  }

  if (!externalUrl) {
    return null;
  }

  try {
    const parsed = new URL(externalUrl);
    const parts = parsed.pathname.split("/").filter(Boolean);

    if (parts.length >= 2) {
      return `https://open.spotify.com/embed/${parts[0]}/${parts[1]}`;
    }
  } catch {
    return null;
  }

  return null;
}

export function DiscoverFeedCard({
  item,
  onPlay,
  inlinePlaying = false,
  onInlinePlay,
  isAuthenticated = false,
}: DiscoverFeedCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likeCount ?? 0);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(inlinePlaying);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  const artworkUrl =
    item.thumbnailUrl ||
    (item.releaseId
      ? `/api/public/v1/releases/${item.releaseId}/artwork?v=2`
      : null);

  const youtubeId = useMemo(
    () =>
      item.provider === "YOUTUBE"
        ? youtubeVideoId(item.externalUrl, item.embedUrl)
        : null,
    [item.embedUrl, item.externalUrl, item.provider],
  );

  const spotifyUrl = useMemo(
    () =>
      item.provider === "SPOTIFY"
        ? spotifyEmbedUrl(item.externalUrl, item.embedUrl)
        : null,
    [item.embedUrl, item.externalUrl, item.provider],
  );

  const artistHref = item.artist?.slug ? `/artist/${item.artist.slug}` : null;
  const isLocalAudio = item.sourceType === "RADARUNE" && Boolean(item.trackId);

  const shouldShowYoutube =
    item.provider === "YOUTUBE" &&
    Boolean(youtubeId) &&
    (inlinePlaying || playing);

  const shouldShowSpotify =
    item.provider === "SPOTIFY" &&
    Boolean(spotifyUrl) &&
    (inlinePlaying || playing);

  useEffect(() => {
    if (!audioRef.current || !isLocalAudio) return;
    if (playing) {
      void audioRef.current.play().catch(() => setPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isLocalAudio, playing]);

  async function likeItem() {
    if (!isAuthenticated) {
      router.push("/sign-in?next=/discover");
      return;
    }

    const payload = item.trackId
      ? { trackId: item.trackId }
      : item.releaseId
        ? { releaseId: item.releaseId }
        : {
            externalMediaId: item.externalMediaId,
          };

    try {
      const response = await fetch("/api/growth/like", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return;
      }

      setLiked((current) => {
        setLikeCount((count) => Math.max(0, count + (current ? -1 : 1)));

        return !current;
      });
    } catch {
      // Ağ hatasında keşfet akışı çalışmaya devam eder.
    }
  }

  function playItem() {
    setPlaying(true);
    onInlinePlay?.(item);
    onPlay?.(item);
  }

  function togglePlay() {
    if (isLocalAudio) {
      setPlaying((current) => !current);
      onInlinePlay?.(item);
      onPlay?.(item);
      return;
    }

    if (item.provider === "YOUTUBE") {
      if (playing) {
        setPlaying(false);
        return;
      }

      /*
       * Video kart içinde sessiz olarak oynar.
       * Ses ve oynatma kuyruğu Global Web Player
       * üzerinden yönetilir.
       */
      setMuted(true);
      setPlaying(true);
      onInlinePlay?.(item);
      onPlay?.(item);
      return;
    }

    if (item.provider === "SPOTIFY") {
      setPlaying(true);
      onInlinePlay?.(item);
      onPlay?.(item);
      return;
    }

    playItem();
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-full sm:max-w-[760px]">
      <article className="w-full min-w-0 max-w-full overflow-hidden rounded-[28px] border border-black/10 bg-[#07090c] shadow-[0_28px_90px_rgba(15,23,42,0.22)]">
        <div
          className="relative aspect-video w-full min-w-0 cursor-pointer overflow-hidden"
          onClick={togglePlay}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              togglePlay();
            }
          }}
        >
          {shouldShowYoutube && youtubeId ? (
            <iframe
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 block size-full max-w-full border-0"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=1&rel=0&playsinline=1&mute=1`}
              title={item.title}
            />
          ) : shouldShowSpotify && spotifyUrl ? (
            <iframe
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className="absolute inset-0 block size-full max-w-full border-0"
              src={spotifyUrl}
              title={item.title}
            />
          ) : artworkUrl ? (
            <div
              aria-label={`${item.title} kapak görseli`}
              className="absolute inset-0 scale-[1.01] bg-cover bg-center transition duration-700 hover:scale-[1.04]"
              role="img"
              style={{
                backgroundImage: `url("${artworkUrl}")`,
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,#1d2939,#050608_70%)]">
              <Music2 className="size-20 text-white/20" />
            </div>
          )}

          {isLocalAudio && item.trackId ? <audio aria-label={`${item.title} oynatıcı`} className="absolute inset-x-5 bottom-5 z-20 w-[calc(100%-2.5rem)] rounded-full opacity-95" controls onEnded={() => setPlaying(false)} preload="none" ref={audioRef} src={`/api/public/v1/tracks/${item.trackId}/stream`} /> : null}

          {!shouldShowYoutube && !shouldShowSpotify ? (
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-black/20" />
          ) : null}

          {item.provider === "YOUTUBE" ? (
            <button
              aria-label={muted ? "Sesi aç" : "Sesi kapat"}
              className="absolute right-5 top-5 z-20 inline-flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-black/55 text-white backdrop-blur-xl"
              onClick={(event) => {
                event.stopPropagation();
                setMuted((current) => !current);
              }}
              type="button"
            >
              {muted ? (
                <VolumeX className="size-5" />
              ) : (
                <Volume2 className="size-5" />
              )}
            </button>
          ) : null}

          {!shouldShowYoutube && !shouldShowSpotify ? (
            <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-5 sm:p-7">
              <div className="flex min-w-0 items-center gap-4">
                <button
                  aria-label={playing ? "Şarkıyı duraklat" : "Şarkıyı oynat"}
                  className="inline-flex size-14 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-xl transition hover:scale-105 hover:bg-white hover:text-black"
                  onClick={(event) => {
                    event.stopPropagation();
                    togglePlay();
                  }}
                  type="button"
                >
                  {playing ? (
                    <Pause className="size-5 fill-current" />
                  ) : (
                    <Play className="ml-0.5 size-5 fill-current" />
                  )}
                </button>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-white sm:text-2xl">
                    {item.title}
                  </h2>

                  {artistHref ? (
                    <Link
                      className="mt-1 block truncate text-sm text-white/60 hover:text-white"
                      href={artistHref}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {item.artistName}
                    </Link>
                  ) : (
                    <p className="mt-1 truncate text-sm text-white/60">
                      {item.artistName}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1 text-white">
                <button
                  aria-label="Beğen"
                  className="inline-flex h-11 items-center gap-2 rounded-full px-3 transition hover:bg-white/10"
                  onClick={(event) => {
                    event.stopPropagation();
                    void likeItem();
                  }}
                  type="button"
                >
                  <Heart
                    className={`size-5 ${
                      liked ? "fill-[#ff665a] text-[#ff665a]" : ""
                    }`}
                  />

                  <span className="text-sm font-semibold">{likeCount}</span>
                </button>

                <div className="inline-flex h-11 items-center gap-2 rounded-full px-3">
                  <MessageCircle className="size-5" />
                  <span className="text-sm font-semibold">Yorum</span>
                </div>

                <button
                  aria-label="Tam ekran"
                  className="inline-flex size-11 items-center justify-center rounded-full transition hover:bg-white/10"
                  onClick={(event) => {
                    event.stopPropagation();

                    const media = event.currentTarget
                      .closest("article")
                      ?.querySelector("[role='button']") as HTMLElement | null;

                    void media?.requestFullscreen?.();
                  }}
                  type="button"
                >
                  <Maximize2 className="size-5" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </article>

      {artistHref ? <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/[0.07] bg-white/85 px-4 py-3 shadow-sm backdrop-blur-xl"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b9693]">Sanatçı kanalı</p><Link className="mt-1 block truncate text-sm font-semibold text-[#101817] hover:text-emerald-700" href={artistHref}>{item.artistName}</Link></div><div className="flex shrink-0 items-center gap-2"><Link className="rounded-xl bg-[#101817] px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700" href={artistHref}>Profili aç →</Link>{item.artist?.id ? <DiscoverArtistFollowButton artistId={item.artist.id} initialFollowing={item.isFollowing ?? false} isAuthenticated={isAuthenticated} /> : null}</div></div> : null}

      <section className="mt-5 overflow-hidden rounded-[26px] border border-black/[0.07] bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#65706e]">
              Yorumlar
            </p>

            <p className="mt-1 text-sm text-[#8b9693]">
              Bu şarkı hakkındaki düşünceni paylaş.
            </p>
          </div>

          <MessageCircle className="size-5 text-[#65706e]" />
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <DiscoverCommentForm
            externalMediaId={item.externalMediaId}
            isAuthenticated={isAuthenticated}
            loginHref="/sign-in?next=/discover"
            releaseId={item.releaseId}
            trackId={item.trackId}
          />
        </div>
      </section>
    </div>
  );
}
