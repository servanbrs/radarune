import { UploadCloud, Bot, ShieldCheck, Globe2 } from "lucide-react";

const steps = [
  {
    icon: UploadCloud,
    title: "Şarkını Yükle",
    description:
      "WAV dosyanı, kapak görselini ve metadata bilgilerini birkaç dakika içinde yükle.",
  },
  {
    icon: Bot,
    title: "Radarune AI Review",
    description:
      "Ses kalitesi, kapak, metadata ve teknik kontroller otomatik olarak analiz edilir.",
  },
  {
    icon: ShieldCheck,
    title: "Admin Onayı",
    description:
      "Ekibimiz yayını inceleyerek son kalite kontrolünü gerçekleştirir.",
  },
  {
    icon: Globe2,
    title: "Platformlarda Yayında",
    description:
      "Onaylanan yayınlar ONErpm üzerinden dijital platformlara gönderilir.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-32">

      <div className="mb-16 text-center">

        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
          Nasıl Çalışır?
        </span>

        <h2 className="mt-6 text-5xl font-black">
          Yayın Süreci
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-zinc-500">
          Radarune, sanatçılar için hızlı, güvenli ve kontrollü bir müzik
          dağıtım deneyimi sunar.
        </p>

      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">

        {steps.map((step, index) => {

          const Icon = step.icon;

          return (

            <div
              key={index}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition-all duration-300 hover:-translate-y-2 hover:border-violet-500"
            >
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">

                <Icon className="h-7 w-7 text-violet-400" />

              </div>

              <div className="mb-3 text-sm text-violet-400">
                0{index + 1}
              </div>

              <h3 className="text-2xl font-bold">
                {step.title}
              </h3>

              <p className="mt-4 leading-7 text-zinc-500">
                {step.description}
              </p>

            </div>

          );
        })}

      </div>

    </section>
  );
}