import Link from "next/link";
import { ArrowUpRight, Check, ChevronRight, CircleDot, Compass, Gauge, Headphones, Layers3, ShieldCheck } from "lucide-react";
import type { PublicDiscoverCandidate } from "@/features/growth/server/services/discover.service";
import { StructuredData } from "@/features/seo/components/structured-data";
import { ThemeToggle } from "@/components/theme-toggle";

const capabilities = [
  {
    eyebrow: "01 / RELEASES",
    title: "Yayın fikrinden teslimata, tek akış.",
    description: "Metadata, artwork, track ve hak sahipliği kontrollerini dağınık araçlardan çıkarıp yönetilebilir bir release akışında toplayın.",
    icon: Layers3,
  },
  {
    eyebrow: "02 / DISTRIBUTION",
    title: "Provider süreçlerine tam görünürlük.",
    description: "Dağıtım sağlayıcılarını, mağaza seçimlerini, job durumlarını ve webhook hareketlerini aynı operasyon merkezinden izleyin.",
    icon: ShieldCheck,
  },
  {
    eyebrow: "03 / FINANCE",
    title: "Gelirin nereden geldiğini bilin.",
    description: "Revenue import, royalty split, statement ve payout süreçlerini denetlenebilir finansal kayıtlarla yönetin.",
    icon: Gauge,
  },
] as const;

const workflowSteps = ["Hazırla", "Doğrula", "Dağıt", "Ölç"] as const;

export function RadaruneLandingPage({ discoverReleases = [] }: { discoverReleases?: PublicDiscoverCandidate[] }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#090b0f] text-white">
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Radarune",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: "Sanatçılar ve label ekipleri için müzik dağıtım ve katalog operasyon platformu.",
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(circle_at_20%_12%,rgba(239,184,72,0.18),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(48,190,169,0.13),transparent_32%)]" />

      <header className="relative z-10 border-b border-white/10 px-5 py-5 md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Link className="flex items-center gap-3" href="/" aria-label="Radarune ana sayfa">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#efb848] text-sm font-bold text-[#090b0f]">R</span>
            <span className="text-sm font-semibold tracking-[0.24em]">RADARUNE</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex" aria-label="Ana navigasyon">
            <Link className="hover:text-white" href="/">Ana Sayfa</Link>
            <Link className="hover:text-white" href="#discover">Keşfet</Link>
            <Link className="hover:text-white" href="/about">Hakkımızda</Link>
            <Link className="hover:text-white" href="/contact">İletişim</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link className="hidden text-sm font-medium text-white/65 hover:text-white sm:inline" href="/sign-in">Giriş yap</Link>
            <ThemeToggle />
            <Link className="inline-flex items-center gap-2 rounded-full bg-[#efb848] px-4 py-2.5 text-sm font-semibold text-[#090b0f] hover:bg-[#ffd46f]" href="/sign-up">
              Başlayın <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-16 px-5 pb-24 pt-20 md:px-10 md:pb-32 md:pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#efb848]/30 bg-[#efb848]/10 px-3 py-1.5 text-xs font-medium tracking-[0.14em] text-[#ffd46f]">
            <CircleDot className="h-3.5 w-3.5" aria-hidden="true" />
            MÜZİK OPERASYONLARI İÇİN
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.05em] md:text-7xl lg:text-[5.7rem]">
            Müziğinizi ileri taşıyan <span className="text-[#efb848]">operasyon katmanı.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-white/60 md:text-xl">
            Radarune; sanatçılar, label&apos;lar ve dağıtım ekipleri için release yönetimini, provider süreçlerini, finansal raporlamayı ve keşfi tek bir üretim alanında birleştirir.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-[#090b0f] hover:bg-[#efb848]" href="/sign-up">
              Çalışma alanı oluştur <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 font-semibold text-white/80 hover:border-white/50 hover:text-white" href="#capabilities">
              Platformu keşfet <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
          <div className="absolute -inset-8 rounded-[3rem] bg-[#efb848]/10 blur-3xl" />
          <div className="relative rounded-[2rem] border border-white/15 bg-[#11151b]/95 p-4 shadow-2xl shadow-black/40 md:p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">RADARUNE / WORKSPACE</p>
                <p className="mt-2 text-lg font-semibold">Release operasyonu</p>
              </div>
              <span className="rounded-full border border-[#61d2a5]/30 bg-[#61d2a5]/10 px-3 py-1 text-xs text-[#8ae8c2]">Kontrol altında</span>
            </div>
            <div className="grid gap-3 py-5">
              {[
                ["Metadata", "Doğrulandı"],
                ["Artwork & audio", "Hazır"],
                ["Distribution route", "Planlandı"],
              ].map(([label, state]) => (
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4" key={label}>
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#efb848]/15 text-[#efb848]"><Check className="h-4 w-4" aria-hidden="true" /></span>
                    <span className="text-sm text-white/80">{label}</span>
                  </div>
                  <span className="text-xs text-white/45">{state}</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-[#efb848] p-5 text-[#090b0f]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Tek merkez</span>
                <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-4 max-w-xs text-2xl font-semibold leading-tight">Kataloğunuz için net bir sonraki adım.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-white/[0.025] px-5 py-5 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-[0.18em] text-white/35">
          <span>Release management</span><span>Distribution hub</span><span>Royalty intelligence</span><span>Artist growth</span>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32" id="capabilities">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#efb848]">Platformun omurgası</p>
          <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-6xl">Daha az araç. Daha çok kontrol.</h2>
        </div>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {capabilities.map(({ description, eyebrow, icon: Icon, title }) => (
            <article className="group rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-7 transition-colors hover:border-[#efb848]/40 hover:bg-white/[0.06]" key={title}>
              <Icon className="h-6 w-6 text-[#efb848]" aria-hidden="true" />
              <p className="mt-12 text-[10px] font-semibold tracking-[0.2em] text-white/35">{eyebrow}</p>
              <h3 className="mt-4 text-2xl font-semibold leading-tight">{title}</h3>
              <p className="mt-4 leading-7 text-white/55">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 pb-24 md:px-10 md:pb-32 lg:grid-cols-[0.8fr_1.2fr] lg:items-end" id="workflow">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#efb848]">Çalışma akışı</p>
          <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-5xl">Operasyonun her adımı görünür.</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map((step, index) => (
            <div className="border-t border-white/20 pt-4" key={step}>
              <span className="font-mono text-xs text-[#efb848]">0{index + 1}</span>
              <p className="mt-4 text-lg font-semibold">{step}</p>
              <p className="mt-2 text-sm leading-6 text-white/45">Tekrarlanabilir, denetlenebilir, ekipler için anlaşılır.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 md:px-10 md:pb-32" id="discover">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#efb848]"><Compass className="h-4 w-4" aria-hidden="true" /> Radarune Keşfet</p>
            <h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-6xl">Yayınlanan müzikleri keşfedin.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/55">Radarune&apos;da canlıya alınan yayınları inceleyin. Bu vitrin yalnızca gerçek katalog verilerini gösterir.</p>
          </div>
          <Link className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/80 hover:border-[#efb848]/60 hover:text-white" href="/discover">Tümünü keşfet <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
        {discoverReleases.length > 0 ? (
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {discoverReleases.map((release) => {
              const artist = release.artists[0]?.artist;
              return (
                <article className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#11151b] transition hover:-translate-y-1 hover:border-[#efb848]/50" key={release.id}>
                  <div className="relative flex aspect-[1.5/1] flex-col justify-between overflow-hidden bg-[radial-gradient(circle_at_75%_20%,rgba(239,184,72,0.32),transparent_25%),linear-gradient(135deg,#1b2731,#11151b)] p-6">
                    <div className="flex items-start justify-between gap-3"><span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/60">{release.primaryGenre}</span><span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"><Headphones className="h-4 w-4" aria-hidden="true" /></span></div>
                    <div><p className="text-xs uppercase tracking-[0.18em] text-white/40">Canlı katalog</p><h3 className="mt-2 text-2xl font-semibold leading-tight text-white">{release.title}</h3></div>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-5"><p className="text-sm text-white/55">{artist?.name ?? "Radarune sanatçısı"}</p>{artist ? <Link className="inline-flex items-center gap-1 text-sm font-semibold text-[#efb848]" href={`/artist/${artist.slug}`}>Profili aç <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link> : null}</div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-10 rounded-[1.75rem] border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center md:px-10"><Compass className="mx-auto h-8 w-8 text-[#efb848]" aria-hidden="true" /><h3 className="mt-5 text-2xl font-semibold">İlk yayınlarınızı bekliyor.</h3><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/50">Canlı katalog oluştuğunda yayınlar burada görünecek. Radarune sahte içerik üretmez.</p></div>
        )}
      </section>

      <section className="relative z-10 mx-5 mb-8 overflow-hidden rounded-[2rem] bg-[#efb848] px-6 py-14 text-[#090b0f] md:mx-auto md:max-w-7xl md:px-12 md:py-20">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[3rem] border-black/10" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-black/55">Bir sonraki release için</p>
          <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-6xl">Kataloğunuzun çalışma alanını kurun.</h2>
          <Link className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#090b0f] px-6 py-3.5 font-semibold text-white hover:bg-[#20252d]" href="/sign-up">
            Radarune&apos;u deneyin <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-white/35 md:flex-row md:items-center md:justify-between md:px-10">
        <span className="font-semibold tracking-[0.2em] text-white/55">RADARUNE</span>
        <span>Sanatçılar ve label ekipleri için müzik operasyonları.</span>
      </footer>
    </main>
  );
}
