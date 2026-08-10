import Link from "next/link";
import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import {
  ArrowUpRight,
  FileCheck2,
  FileText,
  Gavel,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Kullanım koşulları | Radarune",
  description: "Radarune platformunun hesap, içerik, dağıtım, topluluk ve ödeme kullanım koşulları.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Kullanım koşulları | Radarune", description: "Radarune kullanım koşulları.", url: "/terms", type: "article" },
};

const sections = [
  { id: "kapsam", label: "Kapsam ve kabul" },
  { id: "hesap", label: "Hesap ve güvenlik" },
  { id: "icerik", label: "İçerik ve telif" },
  { id: "dagitim", label: "Dağıtım ve moderasyon" },
  { id: "topluluk", label: "Keşfet ve topluluk" },
  { id: "gelir", label: "Gelir ve ödemeler" },
  { id: "sorumluluk", label: "Sorumluluk ve değişiklikler" },
];

function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-line/70 pt-8 first:border-0 first:pt-0">
      <div className="flex gap-4">
        <span className="font-mono text-xs tracking-[0.18em] text-accent">{number}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <div className="mt-4 space-y-4 text-[0.98rem] leading-8 text-muted">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <section className="relative overflow-hidden rounded-[2rem] border border-line bg-surface p-7 shadow-[0_18px_80px_rgba(19,19,19,0.08)] sm:p-10 lg:p-14">
          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative max-w-4xl">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              <FileText className="h-4 w-4" /> Radarune / Yasal
            </div>
            <div className="mt-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">Kullanım koşulları</h1>
              <div className="shrink-0 rounded-2xl border border-line bg-background/70 px-4 py-3 text-sm text-muted">
                <p className="font-semibold text-foreground">Sürüm 1.0</p>
                <p className="mt-1">Son güncelleme: 29 Temmuz 2026</p>
              </div>
            </div>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-muted">Radarune; sanatçıların, label ekiplerinin ve müzikseverlerin içerik keşfi, katalog yönetimi ve dağıtım süreçlerini tek bir çalışma alanında buluşturur. Hizmeti kullanmadan önce bu koşulları dikkatle okuyun.</p>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="rounded-3xl border border-line bg-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Bu sayfada</p>
              <nav className="mt-4 space-y-1" aria-label="Kullanım koşulları bölümleri">
                {sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`} className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-background hover:text-foreground">
                    {section.label}<ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                  </a>
                ))}
              </nav>
              <div className="mt-5 border-t border-line pt-4 text-xs leading-5 text-muted">Bir sorunuz mu var? <Link className="font-semibold text-accent hover:underline" href="/contact">Bize ulaşın.</Link></div>
            </div>
          </aside>

          <article className="rounded-[2rem] border border-line bg-surface p-7 shadow-[0_18px_80px_rgba(19,19,19,0.06)] sm:p-10 lg:p-14">
            <Section id="kapsam" number="01" title="Kapsam ve kabul">
              <p>Radarune hesabı oluşturarak veya platformu kullanarak bu koşulları, <Link className="font-semibold text-accent hover:underline" href="/privacy">Gizlilik Politikası’nı</Link> ve hizmet içinde gösterilen ek kuralları kabul etmiş olursunuz. Koşulları kabul etmiyorsanız platformu kullanmayın.</p>
              <p>Hizmet; keşfet akışı, sanatçı profilleri, yayın hazırlama, içerik ithalatı, moderasyon, dağıtım operasyonları, smart link ve analiz araçlarını içerebilir. Bazı özellikler hesap rolüne, doğrulama durumuna veya seçilen plana göre kullanılabilir.</p>
            </Section>

            <Section id="hesap" number="02" title="Hesap ve güvenlik">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-background/60 p-4"><LockKeyhole className="h-5 w-5 text-accent" /><p className="mt-3 font-semibold text-foreground">Doğru bilgi</p><p className="mt-1 text-sm leading-6">Kayıt sırasında verdiğiniz ad, e-posta ve profil bilgilerinin güncel ve size ait olması gerekir.</p></div>
                <div className="rounded-2xl border border-line bg-background/60 p-4"><ShieldCheck className="h-5 w-5 text-accent" /><p className="mt-3 font-semibold text-foreground">Hesabınızı koruyun</p><p className="mt-1 text-sm leading-6">Şifrenizi paylaşmayın; şüpheli erişimi derhal <Link className="text-accent hover:underline" href="/contact">bildirin</Link>.</p></div>
              </div>
              <p>Hesabınız üzerinden yapılan işlemlerden, güvenliğinizi ihmal ettiğiniz durumlar dahil olmak üzere, siz sorumlusunuz. Radarune gerekli gördüğünde hesabı geçici olarak askıya alabilir veya erişimi sonlandırabilir.</p>
            </Section>

            <Section id="icerik" number="03" title="İçerik ve telif">
              <p>Yüklediğiniz ses, video, kapak görseli, söz, sanatçı adı ve diğer materyaller için gerekli telif, komşu hak, kişilik ve marka izinlerine sahip olduğunuzu beyan edersiniz.</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Başkasına ait veya izinsiz içerikleri yüklemeyin.</li>
                <li>ISRC, UPC, sanatçı ve hak sahibi bilgilerini doğru girin; sahte veya yanıltıcı metadata kullanmayın.</li>
                <li>Yapay zekâ ile üretilen ya da üçüncü taraf lisansına tabi materyalleri, ilgili lisans koşullarıyla birlikte açıkça belirtin.</li>
              </ul>
              <p>Bir telif bildirimi veya eşleşme alındığında içerik incelemeye alınabilir, yayını durdurulabilir ya da hak doğrulaması istenebilir. İyi niyetli bildirimlere yanıt vermek ve gerekli belgeleri sunmak içerik sahibinin sorumluluğundadır.</p>
            </Section>

            <Section id="dagitim" number="04" title="Dağıtım ve moderasyon">
              <p>Dağıtım talebi, otomatik kontroller ve gerektiğinde moderatör incelemesinden sonra işleme alınır. Yayın; metadata, kapak, ses kalitesi, hak sahipliği, tekrar içerik ve seçilen sağlayıcıların kuralları açısından incelenebilir.</p>
              <p>Bir içeriğin üçüncü taraf platformlarda zaten yayınlanmış olması, ISRC/UPC eşleşmesinin bulunması veya hak sahipliğinin doğrulanamaması durumunda Radarune dağıtımı reddedebilir ya da ek belge isteyebilir. Onay, herhangi bir platformda kesin yayın garantisi anlamına gelmez.</p>
              <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-foreground"><FileCheck2 className="h-5 w-5 text-accent" /><p className="mt-2 font-semibold">İnceleme kaydı</p><p className="mt-1 text-sm leading-6 text-muted">Durum değişiklikleri, hata mesajları ve dağıtım denemeleri hesap içindeki operasyon kayıtlarında gösterilir.</p></div>
            </Section>

            <Section id="topluluk" number="05" title="Keşfet ve topluluk">
              <p>Keşfet alanındaki yayınlar kamuya açık olabilir. Oy, beğeni, yorum, kaydetme ve takip özelliklerini kullanırken diğer kullanıcılara saygılı davranın.</p>
              <p>Spam, bot kullanımı, sahte oy, taciz, nefret söylemi, yanıltıcı tanıtım veya başkasının kimliğine bürünme yasaktır. Bu tür aktiviteler içerik veya hesabın kaldırılmasıyla sonuçlanabilir.</p>
            </Section>

            <Section id="gelir" number="06" title="Gelir ve ödemeler">
              <p>Dağıtım veya gelir paylaşımı sunulan hesaplarda komisyon, ödeme takvimi ve uygunluk koşulları ilgili hizmet ekranında ayrıca gösterilir. Raporlanan gelirler sağlayıcılardan gelen verilere dayanır; gecikme, düzeltme ve iade olabilir.</p>
              <p>Ödeme alabilmek için kimlik, vergi ve ödeme bilgilerinizin doğru olması gerekir. Radarune, dolandırıcılık veya hak ihlali şüphesinde ödemeyi inceleme tamamlanana kadar bekletebilir.</p>
            </Section>

            <Section id="sorumluluk" number="07" title="Sorumluluk ve değişiklikler">
              <p>Radarune’yi güvenilir ve kesintisiz tutmak için çalışırız; ancak internet, sağlayıcı, bakım veya mücbir sebepler nedeniyle hizmette kesinti yaşanabilir. Üçüncü taraf platformların kararları ve politikaları Radarune’nin kontrolünde değildir.</p>
              <p>Bu koşullar hizmet geliştikçe güncellenebilir. Önemli değişiklikleri hesap içi bildirim veya e-posta ile duyururuz. Güncellemeden sonra platformu kullanmaya devam etmeniz yeni koşulları kabul ettiğiniz anlamına gelir.</p>
              <p className="border-t border-line pt-5 text-sm">Telif bildirimi, hesap güvenliği veya koşullarla ilgili sorularınız için <Link className="font-semibold text-accent hover:underline" href="/contact">iletişim formunu</Link> kullanın.</p>
            </Section>

            <div className="mt-10 flex items-start gap-3 rounded-2xl border border-line bg-background/60 p-4 text-sm leading-6 text-muted">
              <Gavel className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <p>Bu metin platform kullanımını açıklamak için hazırlanmıştır; ülkenizdeki emredici hukuk kurallarının yerine geçmez. Yerel hukuki yükümlülükleriniz için uzman görüşü alın.</p>
            </div>
          </article>
        </div>
      </div>
      <PublicFooter />
    </main>
  );
}
