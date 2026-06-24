import {
  Upload,
  ShieldCheck,
  Globe,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Tek Tıkla Dağıtım",
    desc: "Şarkını yükle, metadata'yı doldur ve incelemeye gönder.",
  },
  {
    icon: Sparkles,
    title: "Radarune AI Review",
    desc: "Ses, kapak ve metadata otomatik analiz edilir.",
  },
  {
    icon: Globe,
    title: "50+ Platform",
    desc: "Spotify, Apple Music, TikTok ve daha fazlası.",
  },
  {
    icon: ShieldCheck,
    title: "Manuel Kontrol",
    desc: "Her yayın admin tarafından son kez incelenir.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="mx-auto max-w-7xl px-6 py-32"
    >
      <h2 className="text-center text-5xl font-black">
        Radarune Neler Sunuyor?
      </h2>

      <p className="mx-auto mt-6 max-w-2xl text-center text-zinc-500">
        Müzik dağıtım sürecini tek panelden yönet.
      </p>

      <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4">

        {features.map((item, i) => {

          const Icon = item.icon;

          return (

            <div
              key={i}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition hover:-translate-y-2 hover:border-violet-500"
            >
              <Icon className="mb-6 h-10 w-10 text-violet-400" />

              <h3 className="text-2xl font-bold">
                {item.title}
              </h3>

              <p className="mt-4 text-zinc-500">
                {item.desc}
              </p>

            </div>

          );
        })}

      </div>
    </section>
  );
}