import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { ContactForm } from "@/features/support/components/contact-form";

export default function ContactPage() {
  return (
    <>
      <PublicHeader />
      <main className="page-shell pb-24">
        <div className="grid w-full gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <section className="panel overflow-hidden bg-[#111d20] p-8 text-white md:p-12">
            <p className="text-xs uppercase tracking-[.28em] text-[#44c7ad]">
              Radarune destek merkezi
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
              Birlikte çözelim.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-white/65">
              Telif, dağıtım, ödeme veya hesabınızla ilgili sorularınızı doğru ekibe ulaştıralım.
            </p>
            <div className="mt-12 grid gap-3 text-sm text-white/70">
              <span>✦ Teknik destek ve hesap yardımı</span>
              <span>✦ Telif ve içerik bildirimleri</span>
              <span>✦ İş ortaklığı ve basın talepleri</span>
            </div>
            <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Ortalama yanıt süresi: <strong className="text-white">1 iş günü</strong>
            </div>
          </section>

          <section className="panel p-6 md:p-10">
            <p className="text-xs uppercase tracking-[.25em] text-accent">Bize ulaşın</p>
            <h2 className="mt-3 text-3xl font-semibold">İletişim formu</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Mesajınız ilgili admin ve moderatör ekibine bildirim olarak iletilir.
            </p>
            <ContactForm />
          </section>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
