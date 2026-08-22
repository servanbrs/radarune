"use client";

import Link from "next/link";
import { Compass, Flame, Home, ListMusic, Search, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { t, type Locale } from "@/lib/i18n";

type MobileBottomNavProps = { homeHref: string; profileHref: string; profileLabel: string; locale?: Locale };
const items = [
  { key: "home", href: "", icon: Home },
  { key: "discover", href: "/discover", icon: Compass },
  { key: "lists", href: "/lists", icon: ListMusic },
  { key: "hype", href: "/hype", icon: Flame },
  { key: "search", href: "/search", icon: Search },
  { key: "profile", href: "", icon: UserRound },
] as const;

function activeFor(pathname: string, key: string) {
  if (key === "home") return pathname === "/" || pathname === "/dashboard";
  if (key === "profile") return pathname.startsWith("/mobile-profile") || pathname.startsWith("/settings");
  return pathname === `/${key}` || pathname.startsWith(`/${key}/`);
}

export function MobileBottomNav({ homeHref, profileHref, profileLabel, locale = "tr-TR" }: MobileBottomNavProps) {
  const pathname = usePathname();
  return (
    <nav aria-label="Mobile menu" className="fixed inset-x-0 bottom-0 z-[80] border-t border-black/10 bg-white/95 px-1 pt-2 text-[#52605d] shadow-[0_-12px_40px_rgba(15,23,42,0.12)] backdrop-blur-2xl lg:hidden" style={{ paddingBottom: "max(0.55rem, env(safe-area-inset-bottom))" }}>
      <div className="mx-auto grid max-w-lg grid-cols-6 gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const href = item.key === "home" ? homeHref : item.key === "profile" ? profileHref : item.href;
          const active = activeFor(pathname, item.key);
          return (
            <Link aria-current={active ? "page" : undefined} aria-label={item.key === "profile" ? profileLabel : t(locale, item.key)} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1.5 text-[10px] font-semibold transition ${active ? "bg-[#e5f8f0] text-[#087d70]" : "text-[#7a8783] hover:bg-black/[0.04] hover:text-[#101817]"}`} href={href} key={item.key}>
              <Icon className="size-[18px]" strokeWidth={active ? 2.5 : 2} />
              <span className="truncate">{item.key === "profile" ? profileLabel : t(locale, item.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
