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

  useEffect(() => {
    if (!item?.playbackUrl) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlaying(false);
      setPosition(0);
      setDuration(0);
      return;
    }
    const audio = new Audio(item.playbackUrl);
    audioRef.current = audio;
    const onTime = () => setPosition(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (queue.length > 1) {
        const nextIndex = (index + 1) % queue.length;
        setIndex(nextIndex);
        const nextItem = queue[nextIndex];
        if (nextItem) setItem(nextItem);
      } else {
        setPlaying(false);
      }
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
      if (audioRef.current === audio) audioRef.current = null;
    };
  }, [item?.playbackUrl, queue, index]);

  const value = useMemo<PlayerContextValue>(() => {
    const play = (next: PlayerItem, nextQueue = [next]) => {
      const nextIndex = nextQueue.findIndex((candidate) => candidate.id === next.id);
      setQueue(nextQueue);
      setIndex(nextIndex >= 0 ? nextIndex : 0);
      setItem(next);
      setPlaying(false);
    };
    const move = (step: number) => {
      if (!queue.length) return;
      const nextIndex = (index + step + queue.length) % queue.length;
      setIndex(nextIndex);
      const nextItem = queue[nextIndex];
      if (nextItem) setItem(nextItem);
      setPlaying(false);
    };
    return {
      item, queue, index, playing, position, duration, play,
      toggle: async () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (playing) { audio.pause(); setPlaying(false); return; }
        try { await audio.play(); setPlaying(true); } catch { setPlaying(false); }
      },
      next: () => move(1), previous: () => move(-1),
      seek: (value) => { if (audioRef.current) { audioRef.current.currentTime = value; setPosition(value); } },
      close: () => { audioRef.current?.pause(); setItem(null); setQueue([]); setPlaying(false); },
    };
  }, [duration, index, item, playing, position, queue]);

  return <PlayerContext.Provider value={value}>{children}<GlobalPlayer /></PlayerContext.Provider>;
}
