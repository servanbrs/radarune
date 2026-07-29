import Link from "next/link";
import { ArrowUpRight, Database, Eye, FileText, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

const contents = [
  ["veriler", "Topladığımız veriler"],
  ["kullanim", "Kullanım amaçları"],
  ["paylasim", "Paylaşım ve sağlayıcılar"],
  ["saklama", "Saklama ve güvenlik"],
  ["haklar", "Haklarınız"],
  ["cerezler", "Çerezler"],
];

function PolicySection({ id, number, title, children }: { id: string; number: string; title: string; children: React.ReactNode }) {
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

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <section className="relative overflow-hidden rounded-[2rem] border border-line bg-surface p-7 shadow-[0_18px_80px_rgba(19,19,19,0.08)] sm:p-10 lg:p-14">
          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative max-w-4xl">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-accent"><ShieldCheck className="h-4 w-4" /> Radarune / Gizlilik</div>
            <div className="mt-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">Gizlilik politikası</h1>
              <div className="shrink-0 rounded-2xl border border-line bg-background/70 px-4 py-3 text-sm text-muted"><p className="font-semibold text-foreground">Sürüm 1.0</p><p className="mt-1">Son güncelleme: 29 Temmuz 2026</p></div>
            </div>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-muted">Bu politika, Radarune’yi kullanırken hangi verileri topladığımızı, neden işlediğimizi ve verileriniz üzerindeki seçimlerinizi açıklar. Şeffaf, ölçülü ve güvenli bir veri yaklaşımı benimsiyoruz.</p>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="rounded-3xl border border-line bg-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Bu sayfada</p>
              <nav className="mt-4 space-y-1" aria-label="Gizlilik politikası bölümleri">
                {contents.map(([id, label]) => <a key={id} href={`#${id}`} className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-background hover:text-foreground">{label}<ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" /></a>)}
              </nav>
              <div className="mt-5 border-t border-line pt-4 text-xs leading-5 text-muted">Veri talebiniz mi var? <Link className="font-semibold text-accent hover:underline" href="/contact">Bize ulaşın.</Link></div>
            </div>
          </aside>

          <article className="rounded-[2rem] border border-line bg-surface p-7 shadow-[0_18px_80px_rgba(19,19,19,0.06)] sm:p-10 lg:p-14">
            <PolicySection id="veriler" number="01" title="Topladığımız veriler">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-background/60 p-4"><UserRound className="h-5 w-5 text-accent" /><p className="mt-3 font-semibold text-foreground">Hesap ve profil</p><p className="mt-1 text-sm leading-6">Ad, e-posta, kullanıcı adı, rol, doğrulama ve sanatçı profil bilgileri.</p></div>
                <div className="rounded-2xl border border-line bg-background/60 p-4"><Database className="h-5 w-5 text-accent" /><p className="mt-3 font-semibold text-foreground">Katalog ve içerik</p><p className="mt-1 text-sm leading-6">Yayın metadata’sı, ISRC/UPC, kapak, ses/video dosyaları ve hak sahibi bilgileri.</p></div>
                <div className="rounded-2xl border border-line bg-background/60 p-4"><Eye className="h-5 w-5 text-accent" /><p className="mt-3 font-semibold text-foreground">Kullanım sinyalleri</p><p className="mt-1 text-sm leading-6">Sayfa görüntüleme, keşfet etkileşimleri, oy, beğeni, yorum, oynatma ve cihaz/oturum bilgileri.</p></div>
                <div className="rounded-2xl border border-line bg-background/60 p-4"><Mail className="h-5 w-5 text-accent" /><p className="mt-3 font-semibold text-foreground">İletişim</p><p className="mt-1 text-sm leading-6">Destek başvuruları, iletişim formları ve gönderdiğiniz mesajların içeriği.</p></div>
              </div>
              <p>Şifrelerinizi düz metin olarak saklamayız. Ödeme bilgileri, doğrudan ödeme sağlayıcılarının güvenli sistemlerinde işlenebilir; Radarune yalnızca hizmet için gerekli referansları tutar.</p>
            </PolicySection>

            <PolicySection id="kullanim" number="02" title="Verileri hangi amaçlarla kullanıyoruz?"><p>Verileri hesabınızı oluşturmak, yayın ve dağıtım hizmetlerini sunmak, keşfet akışını kişiselleştirmek, destek taleplerini yanıtlamak ve platform güvenliğini sağlamak için kullanırız.</p><ul className="list-disc space-y-2 pl-5"><li>İçerik ve hak doğrulama süreçlerini yürütmek</li><li>Oy, yorum, takip ve oynatma gibi topluluk özelliklerini çalıştırmak</li><li>Hataları, kötüye kullanımı ve sahte etkileşimleri tespit etmek</li><li>Hizmet performansını ölçmek ve yeni özellikler geliştirmek</li><li>Yasal yükümlülükleri yerine getirmek</li></ul></PolicySection>

            <PolicySection id="paylasim" number="03" title="Paylaşım ve üçüncü taraf sağlayıcılar"><p>Dağıtım talimatı verdiğinizde yalnızca seçtiğiniz hizmet için gereken metadata ve medya bilgilerini ilgili sağlayıcıya iletiriz. Sağlayıcılar; Spotify, YouTube, Apple Music, dağıtım servisleri, dosya depolama ve ödeme altyapıları olabilir.</p><p>Verilerinizi satmayız. Hizmet sağlayıcılarımızın erişimi görevleriyle sınırlıdır ve kendi gizlilik politikaları da uygulanabilir. Kamuya açık profil, yayın, sanatçı adı ve keşfet etkileşimleri platformda diğer ziyaretçiler tarafından görülebilir.</p></PolicySection>

            <PolicySection id="saklama" number="04" title="Saklama ve güvenlik"><p>Verileri, hesabınız aktif olduğu ve hizmeti sunmak için gerekli olduğu sürece saklarız. Hesabınızı kapattığınızda silme veya anonimleştirme süreci başlar; yasal olarak saklanması gereken kayıtlar ilgili süre boyunca korunabilir.</p><p>Şifreleme, erişim yetkileri, denetim kayıtları ve güvenli yedekleme gibi teknik ve idari kontroller uygularız. Hiçbir internet hizmeti mutlak güvenlik garantisi veremez; şüpheli bir durum fark ederseniz gecikmeden <Link className="font-semibold text-accent hover:underline" href="/contact">bildirin</Link>.</p></PolicySection>

            <PolicySection id="haklar" number="05" title="Haklarınız"><p>Uygulanabilir mevzuata bağlı olarak kişisel verilerinize erişme, düzeltme, silme, işlemeyi kısıtlama, itiraz etme ve verilerinizi taşınabilir biçimde alma haklarına sahip olabilirsiniz.</p><div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-foreground"><LockKeyhole className="h-5 w-5 text-accent" /><p className="mt-2 font-semibold">Talep gönderin</p><p className="mt-1 text-sm leading-6 text-muted">Talebinizi hesabınızın e-postasından <a className="text-accent hover:underline" href="mailto:privacy@radarune.com">privacy@radarune.com</a> adresine veya <Link className="text-accent hover:underline" href="/contact">iletişim formuna</Link> gönderin. Güvenliğiniz için kimlik doğrulaması isteyebiliriz.</p></div></PolicySection>

            <PolicySection id="cerezler" number="06" title="Çerezler ve benzer teknolojiler"><p>Oturumu açık tutmak, tema ve dil tercihinizi hatırlamak, güvenliği sağlamak ve temel kullanım ölçümlerini yapmak için gerekli çerezleri kullanabiliriz. İsteğe bağlı analiz çerezleri varsa tercihlerinizi tarayıcı ayarlarından veya gösterilen tercih panelinden değiştirebilirsiniz.</p><p>Çerezleri devre dışı bırakmanız bazı özelliklerin, örneğin oturum açma veya global oynatıcının, düzgün çalışmamasına neden olabilir.</p></PolicySection>

            <div className="mt-10 border-t border-line pt-6 text-sm leading-6 text-muted"><FileText className="mr-2 inline h-4 w-4 text-accent" /> Bu politika hizmet geliştikçe güncellenebilir. Önemli değişiklikleri hesap içi bildirim veya e-posta ile duyururuz. Güncel metin her zaman bu sayfada yayınlanır.</div>
          </article>
        </div>
      </div>
      <PublicFooter />
    </main>
  );
}
