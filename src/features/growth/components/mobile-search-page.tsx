"use client";

import Link from "next/link";
import { ArrowUpRight, Search, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { releasePublicPath } from "@/features/releases/lib/release-url";

type Result = {
  artists: Array<{ id: string; name: string; slug: string }>;
  releases: Array<{ id: string; title: string; artists: Array<{ artist: { name: string } }> }>;
  tracks: Array<{ id: string; title: string; release: { id: string; title: string } }>;
  imported: Array<{ id: string; title: string; artistName: string | null; externalUrl: string; provider: string; artist: { slug: string } | null }>;
  error?: string;
};
const emptyResult: Result = { artists: [], releases: [], tracks: [], imported: [] };

export function MobileSearchPage({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) return;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        const payload = (await response.json()) as Result;
        setResult(response.ok ? payload : { ...emptyResult, error: payload.error ?? "Arama başarısız." });
      } catch { setResult({ ...emptyResult, error: "Arama şu anda kullanılamıyor." }); }
      finally { setLoading(false); }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setQuery((value) => value.trim()); }
  const visibleResult = query.trim().length >= 2 ? result : null;
  const hasResults = Boolean(visibleResult && (visibleResult.artists.length || visibleResult.releases.length || visibleResult.tracks.length || visibleResult.imported.length));
  return (
    <main className="mx-auto max-w-3xl px-1 pb-8 pt-2 sm:px-3 lg:pt-8">
      <section className="rounded-[2rem] bg-[#071612] p-5 text-white shadow-[0_24px_70px_rgba(4,24,20,0.2)] sm:p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#54e7c2]">Radarune arama</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-5xl">Yeni sesi bul.</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">Sanatçı, yayın veya şarkı ara; sonuçtan ayrılmadan doğru profile ya da içeriğe geç.</p>
        <form className="mt-6 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] p-2" onSubmit={submit}>
          <Search className="ml-2 size-5 shrink-0 text-[#54e7c2]" />
          <input aria-label="Sanatçı, yayın veya şarkı ara" autoFocus className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-white/35" onChange={(event) => setQuery(event.target.value)} placeholder="Sanatçı, şarkı veya yayın..." value={query} />
          <button className="rounded-xl bg-[#54e7c2] px-4 py-3 text-xs font-black text-[#06231b]" type="submit">Ara</button>
        </form>
      </section>
      <section className="mt-5 space-y-3">
        {loading && query.trim().length >= 2 ? <div className="rounded-2xl border border-black/10 bg-white/80 p-5 text-sm text-muted">Aranıyor...</div> : null}
        {!loading && visibleResult?.error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{visibleResult.error}</div> : null}
        {!loading && visibleResult && !hasResults && !visibleResult.error ? <div className="rounded-2xl border border-dashed border-black/15 bg-white/75 p-8 text-center text-sm text-muted">Bu aramayla eşleşen sonuç bulunamadı.</div> : null}
        {visibleResult?.artists.map((item) => <Link className="flex items-center gap-4 rounded-2xl border border-black/[0.07] bg-white/85 p-4 shadow-sm transition hover:border-emerald-300" href={`/artist/${item.slug}`} key={`artist-${item.id}`}><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#dff7ee] text-sm font-black text-[#087d70]">{item.name.slice(0, 1).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#087d70]">Sanatçı</span><span className="mt-1 block truncate font-bold text-[#101817]">{item.name}</span></span><ArrowUpRight className="size-4 text-[#087d70]" /></Link>)}
        {visibleResult?.releases.map((item) => <Link className="flex items-center gap-4 rounded-2xl border border-black/[0.07] bg-white/85 p-4 shadow-sm transition hover:border-emerald-300" href={releasePublicPath(item.title, item.id)} key={`release-${item.id}`}><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff0d7] text-[#a15a00]"><Sparkles className="size-5" /></span><span className="min-w-0 flex-1"><span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#a15a00]">Yayın</span><span className="mt-1 block truncate font-bold text-[#101817]">{item.title}</span><span className="mt-1 block truncate text-xs text-muted">{item.artists[0]?.artist.name ?? "Radarune kataloğu"}</span></span><ArrowUpRight className="size-4 text-[#087d70]" /></Link>)}
        {visibleResult?.tracks.map((item) => <Link className="flex items-center gap-4 rounded-2xl border border-black/[0.07] bg-white/85 p-4 shadow-sm transition hover:border-emerald-300" href={releasePublicPath(item.release.title, item.release.id)} key={`track-${item.id}`}><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e9e8ff] text-xs font-black text-[#4b43a6]">♪</span><span className="min-w-0 flex-1"><span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#4b43a6]">Şarkı</span><span className="mt-1 block truncate font-bold text-[#101817]">{item.title}</span><span className="mt-1 block truncate text-xs text-muted">{item.release.title}</span></span><ArrowUpRight className="size-4 text-[#087d70]" /></Link>)}
      </section>
    </main>
  );
}
