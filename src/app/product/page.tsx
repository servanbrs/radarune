import type { Metadata } from "next";
import { seoUrl } from "@/features/seo/server/seo-url";
import { RadaruneLandingPage } from "@/features/platform/components/radarune-landing-page";

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

export default function ProductPage() {
  return <RadaruneLandingPage />;
}
