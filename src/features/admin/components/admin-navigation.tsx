"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Bot,
  Boxes,
  ClipboardCheck,
  FileClock,
  FileText,
  Globe2,
  HardDrive,
  LayoutDashboard,
  LifeBuoy,
  ListMusic,
  Megaphone,
  MessageCircle,
  Network,
  PlugZap,
  Radio,
  ReceiptText,
  Search,
  Settings2,
  SlidersHorizontal,
  Trophy,
  Users,
  Webhook,
  Workflow,
} from "lucide-react";

type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

type AdminNavGroup = {
  title: string;
  icon: LucideIcon;
  items: AdminNavItem[];
};

const moderatorPaths = new Set([
  "/admin/moderation",
  "/admin/releases",
  "/admin/applications",
  "/admin/site-builder/discover",
  "/admin/social/playlists",
  "/admin/analytics",
  "/admin/support",
]);

export const adminNavigationGroups: AdminNavGroup[] = [
  {
    title: "Kontrol merkezi",
    icon: LayoutDashboard,
    items: [
      { href: "/admin", label: "Genel bakış", icon: LayoutDashboard },
      { href: "/admin/users", label: "Kullanıcılar", icon: Users },
      { href: "/admin/artists", label: "Sanatçılar", icon: Megaphone },
      { href: "/admin/applications", label: "Başvurular", icon: ClipboardCheck },
    ],
  },
  {
    title: "Operasyon",
    icon: Workflow,
    items: [
      { href: "/admin/releases", label: "Yayın moderasyonu", icon: FileText },
      { href: "/admin/distribution", label: "Dağıtım merkezi", icon: Radio },
      { href: "/admin/distribution/jobs", label: "Job kuyruğu", icon: Workflow },
      { href: "/admin/distribution/dead-letter", label: "Dead-letter", icon: FileClock },
      { href: "/admin/distribution/webhooks", label: "Provider webhookları", icon: Webhook },
      { href: "/admin/support", label: "Destek merkezi", icon: LifeBuoy },
    ],
  },
  {
    title: "Finans & analiz",
    icon: BarChart3,
    items: [
      { href: "/admin/finance", label: "Finans yönetimi", icon: ReceiptText },
      { href: "/admin/finance/providers", label: "Ödeme sağlayıcıları", icon: PlugZap },
      { href: "/admin/intelligence/usage", label: "Kullanım analitiği", icon: BarChart3 },
      { href: "/admin/analytics", label: "Detaylı kullanım analizi", icon: Activity },
      { href: "/admin/audit-logs", label: "İşlem kayıtları", icon: FileClock },
    ],
  },
  {
    title: "İçerik & keşif",
    icon: Search,
    items: [
      { href: "/admin/social/playlists", label: "Global playlistler", icon: ListMusic },
      { href: "/admin/social", label: "Sosyal moderasyon", icon: Globe2 },
      { href: "/admin/growth", label: "AI büyüme merkezi", icon: Megaphone },
      { href: "/admin/growth/weekly-picks", label: "Haftalık paylaşım kartı", icon: Trophy },
      { href: "/admin/intelligence", label: "Yapay zekâ yönetimi", icon: Bot },
      { href: "/admin/site-builder", label: "Site builder", icon: SlidersHorizontal },
    ],
  },
  {
    title: "Entegrasyonlar",
    icon: Network,
    items: [
      { href: "/admin/integrations", label: "Entegrasyon merkezi", icon: Network },
      { href: "/admin/providers", label: "Provider merkezi", icon: Boxes },
      { href: "/admin/import-sources", label: "Toplu müzik aktarımı", icon: Workflow },
      { href: "/admin/import-review", label: "Aktarım moderasyonu", icon: ClipboardCheck },
      { href: "/admin/integrations/youtube", label: "YouTube", icon: Radio },
      { href: "/admin/integrations/spotify", label: "Spotify", icon: Activity },
      { href: "/admin/storage", label: "Dosya depolama", icon: HardDrive },
      { href: "/admin/webhooks", label: "Webhooks", icon: Webhook },
      { href: "/admin/integrations/whatsapp", label: "WhatsApp bildirimleri", icon: MessageCircle },
    ],
  },
  {
    title: "Sistem",
    icon: Settings2,
    items: [
      { href: "/admin/settings", label: "Platform ayarları", icon: Settings2 },
      { href: "/admin/email", label: "SMTP & e-posta", icon: Megaphone },
      { href: "/admin/seo", label: "SEO yönetimi", icon: Search },
      { href: "/admin/system/health", label: "Sistem doktoru", icon: Activity },
      { href: "/admin/system-logs", label: "Sistem logları", icon: FileClock },
    ],
  },
];

export function AdminNavigation({ systemRole }: { systemRole: string }) {
  const pathname = usePathname();
  const groups = systemRole === "MODERATOR"
    ? adminNavigationGroups.map((group) => ({ ...group, items: group.items.filter((item) => moderatorPaths.has(item.href)) })).filter((group) => group.items.length > 0)
    : adminNavigationGroups;

  return (
    <nav aria-label="Admin menüsü" className="grid gap-2">
      {(() => {
        const dashboardHref = systemRole === "MODERATOR" ? "/moderator" : "/admin";
        const isCurrent = pathname === dashboardHref || pathname.startsWith(`${dashboardHref}/`);
        return (
          <Link
            aria-current={isCurrent ? "page" : undefined}
            className={`group/item flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${isCurrent ? "bg-[#d6a85f] text-[#17120b] shadow-[0_8px_22px_rgba(214,168,95,0.2)]" : "text-white/75 hover:bg-white/[0.07] hover:text-white"}`}
            href={dashboardHref}
          >
            <LayoutDashboard className={`size-4 shrink-0 ${isCurrent ? "text-[#17120b]" : "text-white/55 group-hover/item:text-[#d6a85f]"}`} />
            <span className="truncate">{systemRole === "MODERATOR" ? "Moderatör paneli" : "Dashboard"}</span>
          </Link>
        );
      })()}
      {groups.map((group) => {
        const GroupIcon = group.icon;
        const active = group.items.some((item) => {
          const hrefPath = item.href.split("#")[0];
          return pathname === hrefPath || (hrefPath !== "/admin" && pathname.startsWith(`${hrefPath}/`));
        });

        return (
          <details className="admin-nav-group group" key={group.title} open={active || group.title === "Kontrol merkezi"}>
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/68 transition hover:bg-white/[0.06] hover:text-white [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2"><GroupIcon className="size-3.5" />{group.title}</span>
              <span className="text-sm text-white/55 transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <div className="mt-1 grid gap-0.5 pl-1">
              {group.items.map((item) => {
                const ItemIcon = item.icon;
                const hrefPath = item.href.split("#")[0];
                const isCurrent = pathname === hrefPath || (hrefPath !== "/admin" && pathname.startsWith(`${hrefPath}/`));

                return (
                  <Link
                    aria-current={isCurrent ? "page" : undefined}
                    className={`group/item flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${isCurrent ? "bg-[#d6a85f] text-[#17120b] shadow-[0_8px_22px_rgba(214,168,95,0.2)]" : "text-white/75 hover:bg-white/[0.07] hover:text-white"}`}
                    href={item.href}
                    key={item.href}
                  >
                    <ItemIcon className={`size-4 shrink-0 ${isCurrent ? "text-[#17120b]" : "text-white/55 group-hover/item:text-[#d6a85f]"}`} />
                    <span className="truncate">{item.label}</span>
                    {item.badge ? <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">{item.badge}</span> : null}
                  </Link>
                );
              })}
            </div>
          </details>
        );
      })}
    </nav>
  );
}
