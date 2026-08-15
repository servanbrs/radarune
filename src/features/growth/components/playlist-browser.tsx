"use client";

import { Search, Music2, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type PlaylistTrackRow = { id: string; title: string; releaseTitle: string; artists: string[] };
type FollowedReleaseRow = { id: string; title: string; artist: string; tracks: number };

export function PlaylistBrowser({ tracks, followedReleases }: { tracks: PlaylistTrackRow[]; followedReleases: FollowedReleaseRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) return tracks;
    return tracks.filter((track) => [track.title, track.releaseTitle, ...track.artists].join(" ").toLocaleLowerCase("tr-TR").includes(normalized));
  }, [query, tracks]);

  return <>
    <section className="panel p-5 md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.24em] text-accent">Müzik kütüphanesi</p><h1 className="mt-2 text-3xl font-semibold">Şarkı listeleri</h1><p className="mt-2 text-sm text-muted">Radarune kataloğundaki tüm yayınları ara, takip ettiğin sanatçıların yeni parçalarını keşfet.</p></div><div className="flex w-full flex-wrap gap-3 sm:w-auto"><div className="relative min-w-0 flex-1 sm:w-80"><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" /><input className="w-full rounded-full border border-line bg-background py-3 pl-11 pr-4 text-sm outline-none focus:border-accent" onChange={(event) => setQuery(event.target.value)} placeholder="Şarkı, yayın veya sanatçı ara..." value={query} /></div><Link className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background" href="/playlists/new"><Plus className="size-4" />Yeni playlist</Link></div></div>
    </section>
    <section className="panel p-5 md:p-7"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Tüm şarkılar</h2><span className="text-sm text-muted">{filtered.length} sonuç</span></div><div className="mt-4 grid gap-2">{filtered.map((track, index) => <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface-strong p-4" key={track.id}><span className="font-mono text-xs text-muted">{String(index + 1).padStart(2, "0")}</span><span className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><Music2 className="size-5" /></span><div className="min-w-0"><p className="truncate font-semibold">{track.title}</p><p className="truncate text-xs text-muted">{track.artists.join(", ") || "Sanatçı belirtilmedi"} · {track.releaseTitle}</p></div></div>)}{filtered.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">Aramana uygun şarkı bulunamadı.</p> : null}</div></section>
    <section className="panel p-5 md:p-7"><h2 className="text-xl font-semibold">Takip ettiğin sanatçılar</h2><p className="mt-1 text-sm text-muted">Yeni yayınlar burada görünür.</p><div className="mt-4 grid gap-3 md:grid-cols-2">{followedReleases.map((release) => <div className="rounded-2xl border border-line p-4" key={release.id}><p className="font-semibold">{release.title}</p><p className="mt-1 text-sm text-muted">{release.artist} · {release.tracks} parça</p></div>)}{followedReleases.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">Henüz takip ettiğin bir sanatçının yeni yayını yok.</p> : null}</div></section>
  </>;
}
