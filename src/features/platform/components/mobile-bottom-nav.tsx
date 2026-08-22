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
    <nav aria-label="Mobile menu" className="mobile-bottom-nav lg:hidden">
      <div className="mobile-bottom-nav-inner">
        {items.map((item) => {
          const Icon = item.icon;
          const href = item.key === "home" ? homeHref : item.key === "profile" ? profileHref : item.href;
          const active = activeFor(pathname, item.key);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              aria-label={item.key === "profile" ? profileLabel : t(locale, item.key)}
              className="mobile-nav-item"
              data-active={active}
              href={href}
              key={item.key}
            >
              <span className="mobile-nav-icon-wrap">
                <Icon className="mobile-nav-icon" strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className="mobile-nav-label">{item.key === "profile" ? profileLabel : t(locale, item.key)}</span>
              {active ? <span aria-hidden="true" className="mobile-nav-active-indicator" /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
