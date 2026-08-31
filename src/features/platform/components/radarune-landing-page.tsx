/* eslint-disable @next/next/no-img-element -- Landing artwork may be served from runtime storage/provider URLs. */
import Link from "next/link";
import { ArrowUpRight, Check, CircleDot, Compass, Gauge, Headphones, Layers3, ShieldCheck } from "lucide-react";
import type { PublicDiscoverCandidate } from "@/features/growth/server/services/discover.service";
import { StructuredData } from "@/features/seo/components/structured-data";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { QuickSignUpForm } from "@/features/authentication/components/quick-sign-up-form";
import { MobileBottomNav } from "@/features/platform/components/mobile-bottom-nav";
import { getRequestLocale } from "@/lib/i18n-server";
import { normalizeLocale, t } from "@/lib/i18n";

const capabilities = [
  {
    eyebrow: "01 / KEŞFET",
    title: "Yeni müzikleri keşfet.",
    description: "Yeni sanatçıları ve yayınları keşfet, oyla ve radarına ekle.",
    icon: Layers3,
  },
  {
    eyebrow: "02 / DUYUR",
    title: "Şarkını duyur.",
    description: "Sanatçı profilini oluştur, yayınını ekle ve doğru dinleyiciyle buluştur.",
    icon: ShieldCheck,
  },
  {
    eyebrow: "03 / ÜCRETSİZ",
    title: "Tamamen ücretsiz.",
    description: "Keşfetmek, oy vermek ve müziğini duyurmak için ücret ödeme.",
    icon: Gauge,
  },
] as const;

const workflowSteps = ["Hazırla", "Doğrula", "Dağıt", "Ölç"] as const;

const frequentlyAskedQuestions = [
  {
    question: "Radarune nedir?",
    answer: "Radarune; yeni müzikleri keşfetmek, sanatçıları takip etmek, şarkılara oy vermek ve sanatçıların yayın operasyonlarını tek bir yerde yönetmek için oluşturulmuş ücretsiz bir müzik platformudur.",
  },
  {
    question: "Sanatçı olarak şarkımı nasıl gönderebilirim?",
    answer: "Ücretsiz hesabını oluşturduktan sonra sanatçı veya üretici çalışma alanından sanatçı profilini oluşturabilir, yayın bilgilerini ve dosyalarını ekleyerek incelemeye gönderebilirsin.",
  },
  {
    question: "Keşfet bölümündeki şarkılar nasıl seçiliyor?",
    answer: "Keşfet akışı; yayın durumu, topluluk oyları, etkileşim ve güncellik sinyallerini birlikte değerlendirir. Böylece yeni ve ilgi gören şarkılar farklı kullanıcılara ulaşabilir.",
  },
  {
    question: "Radarune ile müzik dağıtımı nasıl ilerliyor?",
    answer: "Yayınını hazırlayıp gerekli bilgileri tamamladıktan sonra içerik kontrol edilir. Onaylanan yayınlar dağıtım kuyruğuna alınır ve süreç boyunca durumunu çalışma alanından takip edebilirsin.",
  },
  {
    question: "Smart Link ne işe yarar?",
    answer: "Smart Link; Spotify, Apple Music, YouTube ve diğer bağlantılarını tek, paylaşılabilir bir sayfada birleştirir. Sanatçılar bu sayfayı sosyal profillerinde ve yayın duyurularında kullanabilir.",
  },
  {
    question: "Radarune kullanmak ücretli mi?",
    answer: "Müzik keşfetme, oy verme, sanatçı profili oluşturma ve temel paylaşım özellikleri ücretsizdir. Ücretli bir özellik veya dağıtım adımı varsa işlem öncesinde açıkça belirtilir.",
  },
] as const;

export async function RadaruneLandingPage({ discoverReleases = [] }: { discoverReleases?: PublicDiscoverCandidate[] }) {
  const locale = normalizeLocale(await getRequestLocale());
  return (
    <main className="landing-shell min-h-dvh overflow-hidden bg-[#090b0f] pb-20 text-white lg:pb-0">
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

      <div className="landing-aurora landing-aurora-one pointer-events-none absolute inset-x-0 top-0 h-[38rem]" />
      <div className="landing-aurora landing-aurora-two pointer-events-none absolute right-[-10rem] top-[22rem] h-[30rem] w-[30rem]" />

      <header suppressHydrationWarning data-scroll-hide data-scroll-hidden="false" className="landing-header landing-reveal landing-reveal-delay-1 sticky top-0 z-50 border-b border-white/10 bg-[#090b0f]/90 px-5 py-4 text-white backdrop-blur-xl md:px-10 md:py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Link className="landing-header-brand flex items-center gap-3 text-white" href="/" aria-label="Radarune ana sayfa">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#efb848] text-sm font-bold text-[#090b0f]">R</span>
            <span className="text-sm font-semibold tracking-[0.24em]">RADARUNE</span>
          </Link>
          <nav className="landing-header-nav hidden items-center gap-3 text-xs text-white/70 sm:gap-8 sm:text-sm lg:flex" aria-label="Ana navigasyon">
            <Link className="hover:text-white" href="/">{t(locale, "home")}</Link>
            <Link className="hover:text-white" href="/discover">{t(locale, "discover")}</Link>
            <Link className="hover:text-white" href="/lists">{t(locale, "lists")}</Link>
            <Link className="hover:text-white" href="/hype">Hype</Link>
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Link className="landing-header-login hidden text-sm font-medium text-white/70 hover:text-white sm:inline" href="/sign-in">{t(locale, "login")}</Link>
            <ThemeToggle dark />
            <Link className="inline-flex items-center gap-2 rounded-full bg-[#efb848] px-4 py-2.5 text-sm font-semibold text-[#090b0f] hover:bg-[#ffd46f]" href="/sign-up">
              Başlayın <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 md:px-10 md:pb-24 md:pt-24 lg:min-h-[calc(100vh-5.5rem)] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-20">
        <div className="landing-reveal landing-reveal-delay-2">
          <div className="landing-eyebrow mb-7 inline-flex items-center gap-2 rounded-full border border-[#efb848]/30 bg-[#efb848]/10 px-3 py-1.5 text-xs font-medium tracking-[0.14em] text-[#ffd46f]">
            <CircleDot className="h-3.5 w-3.5" aria-hidden="true" />
            MÜZİĞİN RADARI · BUGÜNÜN YENİ SESLERİ
          </div>
          <p className="mb-5 text-sm font-medium text-white/45">Hoş geldin. İyi müzik burada önce duyulur.</p>
          <h1 className="landing-title max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.05em] md:text-7xl lg:text-[5.25rem]">
            Sanatçını keşfet.<br /><span className="text-[#efb848]">Şarkıyı şimdi dinle.</span><br />Sesini duyur.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-white/60 md:text-xl">
            Yeni sanatçıları ve yayınlarını keşfet, şarkıları hemen dinle ve favorilerini oyla. Sanatçıysan müziğini Radarune topluluğuyla buluştur.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-[#090b0f] hover:bg-[#efb848]" href="/discover">
              Şimdi dinle <Headphones className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 font-semibold text-white/80 hover:border-[#efb848]/60 hover:text-white" href="/sign-up">
              Şarkını duyur <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="landing-reveal landing-reveal-delay-3 landing-float relative mx-auto w-full max-w-xl lg:ml-auto">
          <div className="absolute -inset-8 rounded-[3rem] bg-[#efb848]/10 blur-3xl" />
          <div className="landing-dark-card relative rounded-[2rem] border border-white/15 bg-[#11151b]/95 p-4 shadow-2xl shadow-black/40 md:p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="landing-card-muted font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">RADARUNE / WORKSPACE</p>
                <p className="landing-card-primary mt-2 text-lg font-semibold">Radarune keşif akışı</p>
              </div>
              <span className="rounded-full border border-[#61d2a5]/30 bg-[#61d2a5]/10 px-3 py-1 text-xs text-[#8ae8c2]">Kontrol altında</span>
            </div>
            <div className="landing-now-playing mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8ae8c2]"><span className="landing-pulse-dot h-2 w-2 rounded-full bg-[#61d2a5]" />Şimdi radarında</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-white/35">Canlı akış</span>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="landing-cover-art grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-2xl font-black text-white" aria-hidden="true">
                  <span className="landing-cover-orbit landing-cover-orbit-one" />
                  <span className="landing-cover-orbit landing-cover-orbit-two" />
                  R
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">Bugün keşfedilen ses</p>
                  <p className="mt-1 text-xs text-white/45">Yeni müzikler, gerçek dinleyiciler</p>
                  <div className="landing-wave mt-3" aria-hidden="true">
                    {Array.from({ length: 16 }, (_, index) => <span key={index} />)}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-3 py-5">
              {[
                ["Yeni müzikler", "Her gün"],
                ["Topluluk oyları", "Gerçek zamanlı"],
                ["Sanatçı profili", "Ücretsiz"],
              ].map(([label, state]) => (
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4" key={label}>
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#efb848]/15 text-[#efb848]"><Check className="h-4 w-4" aria-hidden="true" /></span>
                    <span className="landing-card-primary text-sm">{label}</span>
                  </div>
                  <span className="landing-card-muted text-xs">{state}</span>
                </div>
              ))}
            </div>
            <div className="landing-cta-card rounded-2xl bg-[#efb848] p-5 text-[#090b0f]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Tek merkez</span>
                <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-4 max-w-xs text-2xl font-semibold leading-tight">İyi müzik doğru dinleyiciyle buluşur.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-white/[0.025] px-5 py-5 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-[0.18em] text-white/35">
          <span>Şarkı keşfi</span><span>Topluluk oyları</span><span>Ücretsiz sanatçı profili</span><span>Yeni sesler</span>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32" id="capabilities">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#efb848]">Radarune topluluğu</p>
          <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-6xl">Müziği birlikte keşfediyoruz.</h2>
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-1 hover:border-[#efb848]/40" key={step}>
              <span className="font-mono text-xs text-[#efb848]">0{index + 1}</span>
              <p className="mt-4 text-lg font-semibold">{step}</p>
              <p className="mt-2 text-sm leading-6 text-white/55">{["Yayın bilgilerini ve dosyaları hazırla.", "Hak, metadata ve içerik kontrollerini tamamla.", "Doğrulanan içeriği doğru dinleyiciyle buluştur.", "Dinlenme ve oy verilerini takip et."][index]}</p>
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
                    <img
                      alt={`${release.title} kapak görseli`}
                      className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105"
                      src={`/api/public/v1/releases/${release.id}/artwork`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#11151b] via-[#11151b]/35 to-black/10" />
                    <div className="relative z-10 flex items-start justify-between gap-3"><span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/75">{release.primaryGenre}</span><span className="grid h-10 w-10 place-items-center rounded-full bg-black/35 text-white"><Headphones className="h-4 w-4" aria-hidden="true" /></span></div>
                    <div className="relative z-10"><p className="text-xs uppercase tracking-[0.18em] text-white/60">Canlı katalog</p><h3 className="mt-2 text-2xl font-semibold leading-tight text-white">{release.title}</h3></div>
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

      <section className="relative z-10 mx-5 mb-24 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] px-6 py-8 md:mx-auto md:max-w-7xl md:px-10 md:py-10" id="quick-sign-up">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#efb848]">Radarune&apos;a katıl</p><h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.03em] md:text-4xl">Müziğin radarına bugün gir.</h2><p className="mt-3 max-w-md text-sm leading-6 text-white/55">E-posta, ad ve güçlü bir şifreyle ücretsiz hesabını saniyeler içinde oluştur.</p></div>
          <QuickSignUpForm />
        </div>
      </section>

      <section className="relative z-10 mx-5 mb-8 overflow-hidden rounded-[2rem] bg-[#efb848] px-6 py-14 text-[#090b0f] md:mx-auto md:max-w-7xl md:px-12 md:py-20">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[3rem] border-black/10" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-black/55">Müziğin için yeni bir başlangıç</p>
          <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-6xl">Şarkını bugün duyur, yeni dinleyicilere ulaş.</h2>
          <Link className="landing-cta-button mt-8 inline-flex items-center gap-2 rounded-full !bg-[#090b0f] px-6 py-3.5 font-semibold !text-white shadow-lg shadow-black/20 hover:!bg-[#20252d]" href="/sign-up">
            Ücretsiz hesap oluştur <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="landing-faq relative z-10 mx-5 mb-8 rounded-[2rem] border px-6 py-10 md:mx-auto md:max-w-7xl md:px-12 md:py-14" aria-labelledby="faq-title">
        <div className="max-w-2xl">
          <p className="landing-faq-label text-xs font-semibold uppercase tracking-[0.24em]">Sıkça sorulan sorular</p>
          <h2 id="faq-title" className="landing-faq-title mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] md:text-5xl">Radarune hakkında merak edilenler.</h2>
          <p className="landing-faq-description mt-4 text-base leading-7">Başlamak, müzik keşfetmek ve yayınını duyurmakla ilgili en sık sorulan soruların yanıtları.</p>
        </div>
        <div className="landing-faq-list mt-8 divide-y rounded-2xl border px-5 md:px-7">
          {frequentlyAskedQuestions.map(({ answer, question }, index) => (
            <details className="group py-5 first:pt-2 last:pb-2" key={question} open={index === 0}>
              <summary className="landing-faq-question flex cursor-pointer list-none items-center justify-between gap-5 py-3 text-base font-semibold marker:hidden md:text-lg">
                <span>{question}</span>
                <span className="landing-faq-icon grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xl font-normal leading-none transition group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="landing-faq-answer max-w-3xl pb-3 pr-12 text-sm leading-7 md:text-base">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="relative z-10 mx-auto grid max-w-7xl gap-8 px-5 py-12 text-sm text-white/55 md:grid-cols-[1.2fr_1fr_1fr] md:px-10">
        <div><p className="font-semibold tracking-[0.2em] text-white/80">RADARUNE</p><p className="mt-3 max-w-xs leading-6">Sanatçılar ve label ekipleri için müzik operasyonları.</p><p className="mt-5 text-xs text-white/35">© {new Date().getFullYear()} Radarune</p></div>
        <nav className="grid content-start gap-3" aria-label="Footer bağlantıları"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Radarune</p><Link className="hover:text-white" href="/about">Hakkımızda</Link><Link className="hover:text-white" href="/contact">İletişim</Link><Link className="hover:text-white" href="/terms">Kullanım koşulları</Link></nav>
        <div className="grid content-start gap-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">{t(locale, "theme")}</p><label className="flex items-center justify-between gap-3">{t(locale, "language")} <LanguageSwitcher locale={locale} /></label></div>
      </footer>

      <MobileBottomNav homeHref="/" profileHref="/sign-in?next=%2F" profileLabel={t(locale, "login")} locale={locale} />
    </main>
  );
}
