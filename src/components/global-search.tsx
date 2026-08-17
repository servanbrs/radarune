"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { releasePublicPath } from "@/features/releases/lib/release-url";

type Result = {
  artists: Array<{ id: string; name: string; slug: string }>;
  releases: Array<{
    id: string;
    title: string;
    artists: Array<{ artist: { name: string } }>;
  }>;
  tracks: Array<{
    id: string;
    title: string;
    release: { id: string; title: string };
  }>;
  imported: Array<{
    id: string;
    title: string;
    artistName: string | null;
    externalUrl: string;
    provider: string;
    artist: { slug: string } | null;
  }>;
  error?: string;
};

export function GlobalSearch() {
  const pathname = usePathname();
  const adminTheme = pathname.startsWith("/admin") || pathname.startsWith("/moderator");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query.trim().length < 2) {
        setResult(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        headers: { Accept: "application/json" },
      })
        .then(async (response) => {
          const payload = await response.json().catch(() => null);
          if (!response.ok)
            throw new Error(payload?.error ?? "Arama başarısız.");
          return payload as Result;
        })
        .then(setResult)
        .catch((error: unknown) =>
          setResult({
            artists: [],
            releases: [],
            tracks: [],
            imported: [],
            error: error instanceof Error ? error.message : "Arama başarısız.",
          }),
        )
        .finally(() => setLoading(false));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [query]);
  const empty =
    result &&
    !result.artists.length &&
    !result.releases.length &&
    !result.tracks.length &&
    !result.imported.length;
  return (
    <div className="relative hidden w-full xl:block">
      <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 shadow-inner shadow-black/10 transition focus-within:ring-2 ${adminTheme ? "border-[#d6a85f]/25 bg-[#18243a] focus-within:border-[#d6a85f]/55 focus-within:ring-[#d6a85f]/15" : "border-white/10 bg-white/[0.07] focus-within:border-emerald-300/40 focus-within:ring-emerald-300/10"}`}>
        <Search className={`h-4 w-4 ${adminTheme ? "text-[#e5bd7b]" : "text-white/55"}`} />
        <input
          aria-label="Şarkı veya sanatçı ara"
          className={`min-w-0 flex-1 bg-transparent text-sm text-white outline-none ${adminTheme ? "placeholder:text-[#b7c2d0]/65" : "placeholder:text-white/40"}`}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Şarkı veya sanatçı ara…"
          value={query}
        />
        {query ? (
          <button
            aria-label="Aramayı temizle"
            className={`transition hover:text-white ${adminTheme ? "text-[#e5bd7b]/75" : "text-white/55"}`}
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {open && query.length > 1 ? (
        <div className={`absolute left-0 right-0 top-12 z-[60] max-h-96 overflow-y-auto rounded-2xl border p-2 text-white shadow-2xl ${adminTheme ? "border-[#d6a85f]/20 bg-[#10162a]" : "border-white/10 bg-[#10201d]"}`}>
          {loading ? (
            <p className="p-3 text-sm text-white/55">Aranıyor…</p>
          ) : result?.error ? (
            <p className="p-3 text-sm text-danger">{result.error}</p>
          ) : empty ? (
            <p className="p-3 text-sm text-white/55">Sonuç bulunamadı.</p>
          ) : (
            <div className="grid gap-1">
              {result?.artists.map((item) => (
                <Link
                  className="rounded-xl px-3 py-2 text-sm text-white/85 hover:bg-white/10"
                  href={`/artist/${item.slug}`}
                  key={`a-${item.id}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="text-xs uppercase tracking-wider text-accent">
                    Sanatçı
                  </span>
                  <br />
                  {item.name}
                </Link>
              ))}
              {result?.releases.map((item) => (
                <Link
                  className="rounded-xl px-3 py-2 text-sm text-white/85 hover:bg-white/10"
                  href={releasePublicPath(item.title, item.id)}
                  key={`r-${item.id}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="text-xs uppercase tracking-wider text-accent">
                    Yayın
                  </span>
                  <br />
                  {item.title}
                </Link>
              ))}
              {result?.tracks.map((item) => (
                <Link
                  className="rounded-xl px-3 py-2 text-sm text-white/85 hover:bg-white/10"
                  href={releasePublicPath(item.release.title, item.release.id)}
                  key={`t-${item.id}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="text-xs uppercase tracking-wider text-accent">
                    Şarkı · {item.release.title}
                  </span>
                  <br />
                  {item.title}
                </Link>
              ))}
              {result?.imported.map((item) => (
                <a
                  className="rounded-xl px-3 py-2 text-sm text-white/85 hover:bg-white/10"
                  href={item.externalUrl}
                  key={`i-${item.id}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="text-xs uppercase tracking-wider text-accent">
                    {item.provider} import
                  </span>
                  <br />
                  {item.title}
                  <span className="block text-xs text-muted">
                    {item.artistName ?? "Sanatçı bilinmiyor"}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
