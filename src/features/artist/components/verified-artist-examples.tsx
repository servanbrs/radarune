import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Headphones, Link2, Music2 } from "lucide-react";

const exampleTracks = [
  { title: "Her Şeye Rağmen", meta: "RZG! · Yayında", tone: "from-[#f5b35f] via-[#d7784c] to-[#132926]" },
  { title: "Geceye Kalan", meta: "Radarune seçkisi · 02:48", tone: "from-[#74d8c2] via-[#277b83] to-[#102420]" },
  { title: "Yeni Bir Başlangıç", meta: "Tekli · Yayında", tone: "from-[#e6d6ae] via-[#8a7660] to-[#182523]" },
];

export function VerifiedArtistExamples() {
  return (
    <section className="mt-10 overflow-hidden rounded-[2rem] border border-line bg-surface p-6 sm:p-8">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Başvurudan sonra</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Doğrulanmış sanatçı profilin böyle görünebilir
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          Onaylanan sanatçılar, yayınlarını ve tüm platform bağlantılarını tek bir herkese açık profilde sergiler.
        </p>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b1a18] text-white shadow-lg">
          <div className="relative h-28 bg-[radial-gradient(circle_at_75%_20%,rgba(86,226,191,0.35),transparent_42%),linear-gradient(120deg,#102c28,#0b1515)] p-5">
            <span className="absolute bottom-[-1.75rem] left-5 grid size-14 place-items-center rounded-2xl border-4 border-[#0b1a18] bg-[#f3e5d0] text-xl font-black text-[#117c72]">R</span>
          </div>
          <div className="p-5 pt-9">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold">RZG!</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-300/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                <CheckCircle2 className="size-3.5" /> Doğrulanmış sanatçı
              </span>
            </div>
            <p className="mt-1 text-sm text-white/60">Sanatçı kanalı · Herkese açık profil</p>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
              {[ ["3", "Yayın"], ["1", "Takipçi"], ["12", "Oy"] ].map(([value, label]) => (
                <div className="rounded-xl bg-white/[0.07] px-2 py-3" key={label}>
                  <b className="block text-base text-white">{value}</b>
                  <span className="text-white/50">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.07] px-3 py-2 text-white/75"><Headphones className="size-3.5" /> Radarune içinde dinle</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.07] px-3 py-2 text-white/75"><Music2 className="size-3.5" /> Spotify</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.07] px-3 py-2 text-white/75"><Link2 className="size-3.5" /> Smart Link</span>
            </div>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-line bg-surface-strong/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Smart Link örneği</p>
              <h3 className="mt-1 text-xl font-semibold">RZG! · Her Şeye Rağmen</h3>
            </div>
            <span className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent"><Link2 className="size-5" /></span>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">Spotify, Apple Music, YouTube ve Radarune dinleme bağlantıları tek sayfada.</p>

          <div className="mt-5 space-y-2">
            {exampleTracks.map((track) => (
              <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5" key={track.title}>
                <div className={`grid size-11 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${track.tone} text-white`}><Music2 className="size-4" /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{track.title}</p><p className="text-xs text-muted">{track.meta}</p></div>
                <ArrowUpRight className="size-4 text-muted" />
              </div>
            ))}
          </div>

          <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline" href="/smart-links">
            Smart Link sayfalarını incele <ArrowUpRight className="size-4" />
          </Link>
        </article>
      </div>
    </section>
  );
}
