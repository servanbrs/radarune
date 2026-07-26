import Link from "next/link";
import { AdminShell } from "@/features/admin/components/admin-shell";

export default function SiteBuilderPage() {
  const cards = [
    ["/admin/site-builder/theme", "Tema ve renkler", "Renk, tipografi, yoğunluk ve görünüm ayarları."],
    ["/admin/site-builder/homepage", "Ana sayfa", "Ana sayfa bölümlerini ve sıralamasını yönetin."],
    ["/admin/site-builder/domains", "Özel alan adları", "DNS doğrulaması gereken tenant alan adlarını yönetin."],
    ["/admin/site-builder/discover", "Discover", "Discover görünümü, filtreleri ve skor ağırlıklarını yönetin."],
    ["/admin/site-builder/branding", "Marka", "Logo, favicon, destek e-postası ve SEO varsayılanlarını yönetin."],
  ] as const;
  return <AdminShell title="Site Builder" description="Tenant markasını, temayı ve yayınlanabilir site sayfalarını güvenli biçimde yönetin."><div className="grid gap-4 md:grid-cols-3">{cards.map(([href, title, description]) => <Link className="panel p-6 transition hover:-translate-y-1" href={href} key={href}><h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{description}</p></Link>)}</div></AdminShell>;
}
