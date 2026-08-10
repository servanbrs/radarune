import Link from "next/link";
import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Hakkımızda | Radarune müzik operasyon platformu",
  description:
    "Radarune; bağımsız sanatçıların ve label ekiplerinin katalog, hak, dağıtım, gelir ve keşif operasyonlarını yönettiği müzik platformudur.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Hakkımızda | Radarune",
    description:
      "Radarune’nin bağımsız sanatçılar ve label ekipleri için geliştirdiği müzik operasyon platformunu tanıyın.",
    url: "/about",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <main className="page-shell pb-24">
        <div className="grid w-full gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="about-hero panel overflow-hidden bg-[#111d20] p-8 text-white md:p-12">
            <p className="text-xs uppercase tracking-[.28em] text-[#44c7ad]">Radarune hakkında</p>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">Müziğin arkasındaki operasyonu sadeleştiriyoruz.</h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-white/65">Bağımsız sanatçıların ve label ekiplerinin kataloglarını, haklarını, dağıtımını ve gelirini tek bir güvenilir çalışma alanında yönetmesine yardımcı oluyoruz.</p>
          </section>
          <section className="grid gap-4">
            <article className="panel p-6"><p className="text-xs uppercase tracking-[.2em] text-muted">Misyon</p><h2 className="mt-3 text-2xl font-semibold">Hak sahibi doğru kişiye ulaşsın.</h2><p className="mt-3 text-sm leading-7 text-muted">ISRC/UPC doğrulama, moderasyon ve şeffaf raporlarla her yayın izlenebilir.</p></article>
            <article className="panel p-6"><p className="text-xs uppercase tracking-[.2em] text-muted">Başlayın</p><p className="mt-3 text-sm leading-7 text-muted">Kataloğunuzu bugün düzenlemeye başlayın.</p><Link className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 font-semibold text-accent-foreground" href="/sign-up">Çalışma alanı oluştur →</Link></article>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
