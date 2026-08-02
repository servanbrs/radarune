"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const adminNavigationGroups = [
  { title: "Genel", items: [{ href: "/admin", label: "Platform Kontrol Merkezi" }, { href: "/admin/users", label: "Kullanıcılar" }, { href: "/admin/users/new", label: "Kullanıcı ekle" }, { href: "/admin/artists", label: "Sanatçılar" }, { href: "/admin/applications", label: "Başvurular" }] },
  { title: "Yayın ve dağıtım", items: [{ href: "/admin/releases", label: "Yayın Moderasyonu" }, { href: "/admin/moderation", label: "Moderatör paneli" }, { href: "/admin/distribution", label: "Dağıtım" }, { href: "/admin/providers", label: "Providerlar" }, { href: "/admin/import-sources", label: "Otomatik Import" }, { href: "/admin/import-review", label: "Import İnceleme" }] },
  { title: "Finans", items: [{ href: "/admin/finance", label: "Finans Yönetimi" }] },
  { title: "İçerik ve büyüme", items: [{ href: "/admin/social/playlists", label: "Listeler / Global playlistler" }, { href: "/admin/intelligence", label: "Yapay Zekâ Yönetimi" }, { href: "/admin/site-builder", label: "Site Builder" }] },
  { title: "Entegrasyonlar", items: [{ href: "/admin/integrations/youtube", label: "YouTube" }, { href: "/admin/integrations/spotify", label: "Spotify" }, { href: "/admin/storage", label: "Dosya Depolama" }, { href: "/admin/api-keys", label: "Public API" }, { href: "/admin/webhooks", label: "Webhooks" }] },
  { title: "Sistem", items: [{ href: "/admin/settings", label: "Site Ayarları" }, { href: "/admin/seo", label: "SEO Yönetimi" }, { href: "/admin/sitemap", label: "Sitemap" }, { href: "/admin/settings#smtp", label: "SMTP ve e-posta" }, { href: "/admin/audit-logs", label: "İşlem Kayıtları" }, { href: "/admin/system-logs", label: "Sistem Logları" }, { href: "/admin/system/health", label: "Sistem Doktoru" }] },
] as const;

export function AdminNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Admin menüsü" className="grid gap-3">{adminNavigationGroups.map((group) => { const active = group.items.some((item) => pathname === item.href.split("#")[0] || (item.href !== "/admin" && pathname.startsWith(item.href.split("#")[0] + "/"))); return <details className="group" key={group.title} open={active || group.title === "Genel"}><summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted transition hover:bg-surface-strong [&::-webkit-details-marker]:hidden"><span>{group.title}</span><span className="text-base transition-transform group-open:rotate-180">⌄</span></summary><div className="mt-1 grid gap-1">{group.items.map((item) => { const hrefPath = item.href.split("#")[0]; const isCurrent = pathname === hrefPath || (hrefPath !== "/admin" && pathname.startsWith(hrefPath + "/")); return <Link aria-current={isCurrent ? "page" : undefined} className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${isCurrent ? "bg-accent text-accent-foreground shadow-sm" : "text-muted hover:bg-surface-strong hover:text-foreground"}`} href={item.href} key={item.href}>{item.label}</Link>; })}</div></details>; })}</nav>;
}
