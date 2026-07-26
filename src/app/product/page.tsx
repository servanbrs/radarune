import type { Metadata } from "next";
import Link from "next/link";
import { StructuredData } from "@/features/seo/components/structured-data";
import { seoUrl } from "@/features/seo/server/seo-url";

export const metadata: Metadata = {
  title: "Radarune | Müzik dağıtımı ve sanatçı operasyonları",
  description: "Radarune; release yönetimi, dağıtım, analitik, royalty ve keşif operasyonlarını tek bir platformda birleştirir.",
  alternates: { canonical: seoUrl("/product") },
  openGraph: {
    title: "Radarune | Müzik dağıtım platformu",
    description: "Müzik operasyonlarınız için güvenli, ölçülebilir ve tenant uyumlu çalışma alanı.",
    url: seoUrl("/product"),
    type: "website",
  },
};

const features = [
  ["Release yönetimi", "Metadata, track, artwork ve doğrulama akışını tek wizard içinde yönetin."],
  ["Dağıtım merkezi", "Provider adapter mimarisiyle gönderim, durum takibi ve webhook süreçlerini yönetin."],
  ["Gelir ve royalty", "İçe aktarılan raporları immutable royalty kayıtları ve finansal statement'larla izleyin."],
  ["Keşif ve büyüme", "Smart link, pre-save, Discover, charts ve public artist deneyimini aynı platformda birleştirin."],
];

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      <StructuredData data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Radarune", applicationCategory: "BusinessApplication", operatingSystem: "Web" }} />
      <section className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-36">
        <p className="text-xs uppercase tracking-[0.3em] text-[#f4b942]">Radarune platform</p>
        <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] md:text-7xl">Müziğinizi dağıtın, yönetin ve büyütün.</h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-white/65">Radarune; sanatçılar, label&apos;lar ve dağıtım ekipleri için release operasyonlarını, provider süreçlerini, finansal raporlamayı ve public keşfi tek bir üretim platformunda toplar.</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link className="rounded-full bg-[#f4b942] px-6 py-3 font-semibold text-black" href="/sign-up">Çalışma alanı oluştur</Link>
          <Link className="rounded-full border border-white/20 px-6 py-3 font-semibold" href="/features">Özellikleri incele</Link>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-2 md:px-10">
        {features.map(([title, description]) => <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-7" key={title}><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-white/60">{description}</p></article>)}
      </section>
    </main>
  );
}
