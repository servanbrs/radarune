import Link from "next/link";
import { Activity, Bot, Cloud, CreditCard, Database, Mail, Music2, Radio, ShieldCheck, Webhook } from "lucide-react";
import { AdminShell } from "@/features/admin/components/admin-shell";

const cards = [
  { href: "/admin/providers", label: "Dağıtım providerları", note: "ONErpm, FUGA, Symphonic ve diğer provider credential, mod ve capability ayarları.", icon: Radio, tone: "bg-emerald-100 text-emerald-800" },
  { href: "/admin/email", label: "E-posta / SMTP", note: "2FA, doğrulama, destek ve sistem e-postalarının gönderici ve şablon ayarları.", icon: Mail, tone: "bg-sky-100 text-sky-800" },
  { href: "/admin/intelligence/providers", label: "AI sağlayıcıları", note: "SEO, metadata ve içerik asistanlarının AI sağlayıcı bağlantıları ve kullanım durumu.", icon: Bot, tone: "bg-violet-100 text-violet-800" },
  { href: "/admin/storage", label: "Dosya depolama", note: "Local/S3 depolama, upload sınırları, private dosya ve imzalı erişim durumu.", icon: Cloud, tone: "bg-amber-100 text-amber-800" },
  { href: "/admin/finance/providers", label: "Ödeme sağlayıcıları", note: "Stripe, iyzico, PayTR veya manuel ödeme yapılandırması ve bağlantı testi.", icon: CreditCard, tone: "bg-rose-100 text-rose-800" },
  { href: "/admin/integrations/spotify", label: "Spotify import", note: "Spotify katalog importu, credential ve zamanlayıcı/cron durumu.", icon: Music2, tone: "bg-green-100 text-green-800" },
  { href: "/admin/integrations/youtube", label: "YouTube import", note: "YouTube kanal importu, quota ve otomatik keşif ayarları.", icon: Activity, tone: "bg-red-100 text-red-800" },
  { href: "/admin/webhooks", label: "Webhook güvenliği", note: "Provider webhook imzası, replay koruması, olay geçmişi ve hata takibi.", icon: Webhook, tone: "bg-slate-100 text-slate-800" },
  { href: "/admin/system/health", label: "Bağlantı ve sistem sağlığı", note: "Database, queue, e-posta, secret ve worker kontrollerinin tek sağlık raporu.", icon: ShieldCheck, tone: "bg-teal-100 text-teal-800" },
  { href: "/admin/settings", label: "Merkezi platform ayarları", note: "Site, üyelik, bakım, SEO, upload ve varsayılan dağıtım davranışları.", icon: Database, tone: "bg-indigo-100 text-indigo-800" },
];

export default function AdminIntegrationsPage() {
  return (
    <AdminShell title="Entegrasyon merkezi" description="Radarune’ın dış servislerini, bağlantı durumlarını ve çalışma modlarını tek görünümden yönetin.">
      <section className="rounded-[28px] bg-[#101817] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">Tek operasyon yüzeyi</p><h1 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">Bağlantıları burada bulun.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Her kart ilgili modüle gider; yanındaki açıklama özelliğin ne işe yaradığını anlatır. Secret değerleri yalnızca server tarafında saklanır ve maskeli gösterilir.</p></div>
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-xs font-semibold text-emerald-200">10 entegrasyon alanı · Yetki kontrollü</div>
        </div>
      </section>
      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ href, label, note, icon: Icon, tone }) => <Link className="group rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-[0_14px_42px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-emerald-300" href={href} key={href}><div className="flex items-start justify-between gap-4"><span className={`flex size-11 items-center justify-center rounded-2xl ${tone}`}><Icon className="size-5" /></span><span className="text-lg text-[#a2adaa] transition group-hover:translate-x-1 group-hover:text-emerald-700">→</span></div><h2 className="mt-5 text-base font-bold">{label}</h2><p className="mt-2 text-sm leading-6 text-[#6d7975]">{note}</p><p className="mt-4 text-xs font-bold text-emerald-700">Modülü aç →</p></Link>)}
      </section>
    </AdminShell>
  );
}
