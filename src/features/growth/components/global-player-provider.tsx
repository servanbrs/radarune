"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { PlayerItem } from "@/features/player/domain/player-source";
import { GlobalPlayer } from "@/features/growth/components/global-player";

type PlayerContextValue = {
  item: PlayerItem | null;
  queue: PlayerItem[];
  index: number;
  playing: boolean;
  position: number;
  duration: number;
  error: string | null;
  play: (item: PlayerItem, queue?: PlayerItem[]) => void;
  toggle: () => Promise<void>;
  next: () => void;
  previous: () => void;
  seek: (value: number) => void;
  close: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function useGlobalPlayer() {
  const value = useContext(PlayerContext);
  if (!value) throw new Error("useGlobalPlayer GlobalPlayerProvider içinde kullanılmalı.");
  return value;
}

export function GlobalPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [item, setItem] = useState<PlayerItem | null>(null);
  const [queue, setQueue] = useState<PlayerItem[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const queueRef = useRef<PlayerItem[]>([]);
  const indexRef = useRef(0);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { indexRef.current = index; }, [index]);

  useEffect(() => {
    if (!item?.playbackUrl) {
      // Keep the single DOM audio element mounted for the lifetime of the
      // application. This is what makes playback survive route changes.
      audioRef.current?.pause();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.preload = "auto";
    const playbackUrl = new URL(item.playbackUrl, window.location.href).href;
    if (audio.src !== playbackUrl) audio.src = playbackUrl;
    audioRef.current = audio;
    const onTime = () => setPosition(audio.currentTime);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onCanPlay = () => {
      // Some storage backends resolve the stream asynchronously. Retrying at
      // canplay makes a click on a card start playback even when the first
      // play() call happened before the first byte was available.
      if (audio.paused) {
        void audio.play().then(() => setPlaying(true)).catch(() => undefined);
      }
    };
    const onError = () => {
      setPlaying(false);
      setError("Ses dosyası oynatılamadı. Lütfen tekrar deneyin.");
    };
    const onEnded = () => {
      const currentQueue = queueRef.current;
      if (currentQueue.length > 1) {
        const nextIndex = (indexRef.current + 1) % currentQueue.length;
        setIndex(nextIndex);
        const nextItem = currentQueue[nextIndex];
        if (nextItem) setItem(nextItem);
      } else {
        setPlaying(false);
      }
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("error", onError);
    audio.addEventListener("ended", onEnded);
    // Start playback immediately when an item is selected from a cover or
    // from the queue. Previously the player created an Audio instance but
    // never called play(), leaving the dock apparently stuck.
    if (audio.paused) {
      audio.load();
      void audio.play().then(() => setPlaying(true)).catch(() => {
        setPlaying(false);
        setError("Oynatma başlatılamadı. Oynat düğmesine tekrar dokunun.");
      });
    }
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("ended", onEnded);
    };
  }, [item?.playbackUrl]);

  const value = useMemo<PlayerContextValue>(() => {
    const play = (next: PlayerItem, nextQueue = [next]) => {
      const nextIndex = nextQueue.findIndex((candidate) => candidate.id === next.id);
      setQueue(nextQueue);
      setIndex(nextIndex >= 0 ? nextIndex : 0);
      setItem(next);
      setError(null);
      setPlaying(next.playbackUrl ? false : Boolean(next.embedUrl));
      if (next.playbackUrl && item?.id === next.id && audioRef.current) {
        void audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      } else if (next.playbackUrl) {
        const audio = audioRef.current;
        if (!audio) return;
        audio.preload = "auto";
        audio.src = new URL(next.playbackUrl, window.location.href).href;
        audio.load();
        // Calling play directly from the user's click preserves the browser's
        // gesture permission; waiting for an effect can be rejected as autoplay.
        void audio.play().then(() => setPlaying(true)).catch((playError: unknown) => {
          setPlaying(false);
          setError(playError instanceof Error && playError.name === "NotAllowedError"
            ? "Oynatmak için oynat düğmesine dokunun."
            : "Ses dosyası oynatılamadı. Lütfen tekrar deneyin.");
        });
      }
    };
    const move = (step: number) => {
      if (!queue.length) return;
      const nextIndex = (index + step + queue.length) % queue.length;
      setIndex(nextIndex);
      const nextItem = queue[nextIndex];
      if (nextItem) setItem(nextItem);
      setPlaying(nextItem?.playbackUrl ? false : Boolean(nextItem?.embedUrl));
    };
    return {
      item, queue, index, playing, position, duration, error, play,
      toggle: async () => {
        const audio = audioRef.current;
        if (item?.embedUrl && !item.playbackUrl) {
          setPlaying((current) => !current);
          return;
        }
        if (!audio) {
          // Provider items are rendered in the persistent iframe. We cannot
          // seek them from an HTMLAudioElement, but toggling the state lets
          // the iframe reload with the correct autoplay intent.
          if (item?.embedUrl) setPlaying((current) => !current);
          return;
        }
        if (playing) { audio.pause(); setPlaying(false); return; }
        try { if (audio.readyState === HTMLMediaElement.HAVE_NOTHING) audio.load(); await audio.play(); setPlaying(true); setError(null); } catch { setPlaying(false); setError("Oynatma başlatılamadı."); }
      },
      next: () => move(1), previous: () => move(-1),
      seek: (value) => { if (audioRef.current) { audioRef.current.currentTime = value; setPosition(value); } },
      close: () => { audioRef.current?.pause(); setItem(null); setQueue([]); setPlaying(false); setError(null); },
    };
  }, [duration, error, index, item, playing, position, queue]);

  return (
    <PlayerContext.Provider value={value}>
      <audio
        aria-hidden="true"
        className="pointer-events-none absolute h-px w-px opacity-0"
        preload="auto"
        ref={audioRef}
      />
      {children}
      <GlobalPlayer
        close={value.close}
        duration={value.duration}
        error={value.error}
        index={value.index}
        item={value.item}
        next={value.next}
        position={value.position}
        previous={value.previous}
        queue={value.queue}
        seek={value.seek}
        playing={value.playing}
        toggle={value.toggle}
      />
    </PlayerContext.Provider>
  );
}
