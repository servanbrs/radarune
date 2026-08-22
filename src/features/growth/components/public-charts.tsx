"use client";
/* eslint-disable @next/next/no-img-element -- Chart artwork can come from provider URLs. */

import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Music2,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type {
  PublicChartSection,
  PublicChartTrack,
} from "@/features/growth/server/services/public-charts.service";
import { TrackPlayButton } from "@/features/growth/components/track-play-button";
import { localize } from "@/lib/i18n";

type PublicChartsProps = {
  sections: PublicChartSection[];
  locale?: string;
};

function ChartTrackCard({
  item,
  rank,
  locale = "tr-TR",
}: {
  item: PublicChartTrack;
  rank: number;
  locale?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isLocalTrack = item.provider === "RADARUNE" && Boolean(item.trackId);
  const isEmbed = !isLocalTrack && Boolean(item.embedUrl);
  const embedUrl = item.embedUrl;

  useEffect(() => {
    if (!audioRef.current) return;
    if (playing) {
      void audioRef.current.play().catch(() => setPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [playing]);

  function togglePlayback() {
    setPlaying((current) => !current);
  }

  return (
    <article className="group relative w-[260px] max-w-[calc(100vw-3rem)] shrink-0 snap-start overflow-hidden rounded-[1.6rem] border border-black/[0.07] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(15,23,42,0.15)] sm:w-[290px]">
      <div className="block">
        <div className="relative aspect-video overflow-hidden bg-[#dfe8e7]">
          {isEmbed && embedUrl ? <iframe allow="autoplay; encrypted-media; picture-in-picture" className="absolute inset-0 size-full" src={`${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=${playing ? "1" : "0"}&playsinline=1&rel=0`} title={item.title} /> : null}
          {item.thumbnailUrl ? (
            <Link
              aria-label={`${item.title} ${localize(locale, { tr: "şarkı sayfasını aç", en: "open song page", de: "Songseite öffnen" })}`}
              className={`${isEmbed || playing ? "hidden" : "block h-full w-full"}`}
              href={item.trackId ? `/track/${item.trackId}` : item.releaseId ? `/release/${item.releaseId}` : item.externalUrl}
            >
              <img
                alt={`${item.title} ${localize(locale, { tr: "kapak görseli", en: "cover artwork", de: "Coverbild" })}`}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
                src={item.thumbnailUrl}
              />
            </Link>
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#0b8274]/20 to-[#111827]/15">
              <Music2 className="size-10 text-[#087d70]" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

          <span className="absolute left-3 top-3 inline-flex min-w-10 items-center justify-center rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-sm font-black text-white backdrop-blur">
            {String(rank).padStart(2, "0")}
          </span>

          <span className="absolute bottom-3 right-3 inline-flex size-11 items-center justify-center rounded-full bg-white text-black shadow-lg transition group-hover:scale-105">
            <button aria-label={playing ? localize(locale, { tr: "Durdur", en: "Pause", de: "Pausieren" }) : localize(locale, { tr: "Radarune içinde oynat", en: "Play in Radarune", de: "In Radarune abspielen" })} className="inline-flex size-full items-center justify-center rounded-full" onClick={togglePlayback} type="button">
              {playing ? <span className="size-3 rounded-sm bg-black" /> : <Play className="ml-0.5 size-4 fill-current" />}
            </button>
          </span>
          {isLocalTrack ? <audio className="absolute inset-x-3 bottom-3 z-10 w-[calc(100%-1.5rem)] rounded-full opacity-90" controls onEnded={() => setPlaying(false)} preload="none" ref={audioRef} src={`/api/public/v1/tracks/${item.trackId}/stream`} /> : null}
        </div>

        <div className="p-4">
          <Link
            className="line-clamp-2 min-h-12 text-base font-bold leading-6 text-black hover:text-[#087d70]"
            href={item.trackId ? `/track/${item.trackId}` : item.releaseId ? `/release/${item.releaseId}` : item.externalUrl}
          >
            {item.title}
          </Link>

          <p className="mt-1 truncate text-sm text-black/50">
            {item.artistName}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/5 pt-3">
            <p className="text-xs text-black/40">
              <span className="font-bold text-[#087d70]">
                {item.metricValue}
              </span>{" "}
              {item.metricLabel}
            </p>

            {item.externalUrl ? <a aria-label={localize(locale, { tr: "Kaynağı yeni sekmede aç", en: "Open source in new tab", de: "Quelle in neuem Tab öffnen" })} className="rounded-full p-1 text-black/35 transition hover:bg-black/5 hover:text-[#087d70]" href={item.externalUrl} rel="noreferrer" target="_blank" onClick={(event) => event.stopPropagation()}><ArrowUpRight className="size-4" /></a> : null}
            {isLocalTrack ? <TrackPlayButton trackId={item.trackId!} className="size-8 bg-[#087d70] text-white hover:bg-[#055d54]" /> : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function ChartRow({
  section,
  locale = "tr-TR",
}: {
  section: PublicChartSection;
  locale?: string;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  function scroll(direction: "left" | "right") {
    rowRef.current?.scrollBy({
      left: direction === "right" ? 650 : -650,
      behavior: "smooth",
    });
  }

  return (
    <section
      className="overflow-hidden rounded-[2rem] border border-black/[0.06] bg-white/65 p-4 shadow-[0_15px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:p-6"
      id={section.id}
    >
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#087d70]">
            {section.eyebrow}
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-black sm:text-3xl">
            {section.title}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/50">
            {section.description}
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            aria-label={localize(locale, { tr: "Önceki şarkılar", en: "Previous songs", de: "Vorherige Songs" })}
            className="inline-flex size-10 items-center justify-center rounded-full border border-black/10 bg-white text-black/55 transition hover:bg-black hover:text-white"
            onClick={() => scroll("left")}
            type="button"
          >
            <ChevronLeft className="size-4" />
          </button>

          <button
            aria-label={localize(locale, { tr: "Sonraki şarkılar", en: "Next songs", de: "Nächste Songs" })}
            className="inline-flex size-10 items-center justify-center rounded-full border border-black/10 bg-white text-black/55 transition hover:bg-black hover:text-white"
            onClick={() => scroll("right")}
            type="button"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </header>

      {section.tracks.length ? (
        <div
          className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          ref={rowRef}
        >
          {section.tracks.map((item, index) => (
            <ChartTrackCard
              item={item}
              key={item.id}
              locale={locale}
              rank={index + 1}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex min-h-40 items-center justify-center rounded-3xl border border-dashed border-black/10 bg-white/60 px-6 text-center">
          <div>
            <Music2 className="mx-auto size-7 text-[#087d70]" />

            <p className="mt-3 text-sm font-bold text-black">
              {localize(locale, { tr: "Bu liste henüz hazırlanamadı", en: "This chart is not ready yet", de: "Diese Liste ist noch nicht bereit" })}
            </p>

            <p className="mt-1 max-w-md text-xs leading-5 text-black/45">
              {localize(locale, { tr: "YouTube API anahtarını admin entegrasyon ayarlarından veya YOUTUBE_API_KEY ortam değişkeninden kontrol edin.", en: "Check the YouTube API key in admin integrations or the YOUTUBE_API_KEY environment variable.", de: "Prüfe den YouTube-API-Schlüssel in den Admin-Integrationen oder die Umgebungsvariable YOUTUBE_API_KEY." })}
            </p>
          </div>
        </div>
      )}

      <footer className="mt-1 flex items-center justify-between border-t border-black/5 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-black/35">
          {localize(locale, { tr: "Kaynak:", en: "Source:", de: "Quelle:" })} {section.sourceLabel}
        </p>

        <p className="text-xs text-black/35">
          {section.tracks.length} {localize(locale, { tr: "içerik", en: "items", de: "Inhalte" })}
        </p>
      </footer>
    </section>
  );
}

export function PublicCharts({
  sections,
  locale = "tr-TR",
}: PublicChartsProps) {
  return (
    <div className="grid gap-6">
      {sections.map((section) => (
        <ChartRow key={section.id} section={section} locale={locale} />
      ))}
    </div>
  );
}
