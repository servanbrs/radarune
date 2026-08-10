import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim ve destek | Radarune",
  description:
    "Radarune destek ekibine ulaşın; dağıtım, telif, ödeme, hesap ve iş ortaklığı konularında bize yazın.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "İletişim ve destek | Radarune",
    description: "Radarune ekibine ulaşın ve doğru desteği alın.",
    url: "/contact",
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
