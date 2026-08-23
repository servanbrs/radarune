"use client";

import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { PublicUserMenu } from "@/features/growth/components/public-user-menu";
import { MobileBottomNav } from "@/features/platform/components/mobile-bottom-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { normalizeLocale, t, type Locale, type TranslationKey } from "@/lib/i18n";

type PublicGrowthShellProps = {
  children: ReactNode;
  currentUser?: {
    name: string;
    username?: string | null;
  } | null;
  locale?: string;
};

const navigation: Array<{ href: string; key: TranslationKey }> = [
  {
    href: "/",
    key: "home",
  },
  {
    href: "/discover",
    key: "discover",
  },
  {
    href: "/lists",
    key: "lists",
  },
  {
    href: "/hype",
    key: "hype",
  },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicGrowthShell({
  children,
  currentUser = null,
  locale,
}: PublicGrowthShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [remoteLocale, setRemoteLocale] = useState<Locale | null>(null);
  const activeLocale = normalizeLocale(locale ?? remoteLocale);

  useEffect(() => {
    if (locale) return;
    let cancelled = false;
    void fetch("/api/organization/locale")
      .then((response) => response.json())
      .then((payload: { locale?: string }) => {
        if (!cancelled) setRemoteLocale(normalizeLocale(payload.locale));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [locale]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = query.trim();

    if (!value) {
      return;
    }

    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <div className="public-growth-shell flex min-h-dvh w-full max-w-none min-w-0 flex-col overflow-x-hidden bg-[radial-gradient(circle_at_12%_8%,rgba(99,238,187,0.2),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(116,143,255,0.2),transparent_30%),linear-gradient(180deg,#f8fffc_0%,#f6f9ff_55%,#f4f7f6_100%)] text-foreground">
      <header data-scroll-hide className="sticky top-0 z-50 border-b border-white/10 bg-[#081311]/95 text-white shadow-[0_12px_50px_rgba(4,15,13,0.2)] backdrop-blur-2xl">
        <div className="mx-auto grid min-h-[72px] w-full max-w-[1600px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:min-h-[76px] sm:gap-4 sm:px-5 lg:px-8">
          <Link
            className="shrink-0 text-base font-black tracking-[0.13em] text-emerald-300 sm:text-lg sm:tracking-[0.15em]"
            href="/"
          >
            RADARUNE
          </Link>

          <div className="hidden min-w-0 justify-center lg:flex">
            <div className="flex w-full max-w-[860px] items-center rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.18)] sm:px-2">
              <nav
                aria-label="Main menu"
                className="hidden shrink-0 items-center gap-1 lg:flex"
              >
                {navigation.map((item) => {
                  const active = isActiveRoute(pathname, item.href);

                  return (
                    <Link
                      className={
                        active
                          ? "rounded-full bg-emerald-300/15 px-5 py-2.5 text-sm font-semibold text-emerald-200"
                          : "rounded-full px-5 py-2.5 text-sm font-semibold text-white/65 transition hover:bg-white/10 hover:text-white"
                      }
                      href={item.href}
                      key={item.href}
                    >
                      {t(activeLocale, item.key)}
                    </Link>
                  );
                })}
              </nav>

              <div className="mx-2 hidden h-7 w-px bg-white/10 lg:block" />

              <form
                className="flex min-w-0 flex-1 items-center"
                onSubmit={submitSearch}
              >
                <input
                  aria-label={t(activeLocale, "search")}
                    className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-white/35 sm:px-4"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t(activeLocale, "searchPlaceholder")}
                  value={query}
                />

                <button
                  aria-label={t(activeLocale, "search")}
                className="mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-emerald-300/15 hover:text-emerald-200"
                  type="submit"
                >
                  <Search className="size-4" />
                </button>
              </form>
            </div>
          </div>

          <div className="hidden shrink-0 items-center justify-end gap-1.5 sm:gap-2 lg:flex">
            {currentUser ? (
              <>
                <NotificationBell locale={activeLocale} />

                <PublicUserMenu currentUser={currentUser} locale={activeLocale} />
              </>
            ) : (
              <Link
                className="whitespace-nowrap rounded-full bg-emerald-300 px-3.5 py-2.5 text-xs font-bold text-[#08201a] shadow-[0_8px_24px_rgba(110,231,183,0.18)] sm:px-5 sm:text-sm"
                href={`/sign-in?next=${encodeURIComponent(
                  pathname || "/discover",
                )}`}
              >
                {t(activeLocale, "login")}
              </Link>
            )}
          </div>
        </div>

      </header>

      <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-[1500px] flex-1 flex-col px-3 py-6 sm:px-5 sm:py-8 lg:px-7">
        {children}
      </div>

      <footer className="border-t border-black/[0.07] bg-white/75 px-4 pb-28 pt-10 text-sm text-[#65706e] backdrop-blur-xl sm:px-6 lg:pb-10">
        <div className="mx-auto flex min-w-0 max-w-[1500px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-[#101817]">Radarune</p>
            <p className="mt-1">{t(activeLocale, "platformTagline")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <nav
              aria-label="Footer menu"
              className="flex flex-wrap gap-x-5 gap-y-2 font-medium"
            >
              <Link className="transition hover:text-[#087d70]" href="/about">
                {t(activeLocale, "about")}
              </Link>
              <Link className="transition hover:text-[#087d70]" href="/contact">
                {t(activeLocale, "contact")}
              </Link>
              <Link className="transition hover:text-[#087d70]" href="/terms">
                {t(activeLocale, "terms")}
              </Link>
              <Link className="transition hover:text-[#087d70]" href="/privacy">
                {t(activeLocale, "privacy")}
              </Link>
            </nav>
            <LanguageSwitcher locale={activeLocale} />
          </div>
        </div>
      </footer>

      <MobileBottomNav locale={activeLocale} homeHref="/" profileHref={currentUser ? "/mobile-profile" : `/sign-in?next=${encodeURIComponent(pathname || "/")}`} profileLabel={currentUser ? t(activeLocale, "profile") : t(activeLocale, "login")} />
    </div>
  );
}
