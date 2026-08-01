"use client";

import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { PublicUserMenu } from "@/features/growth/components/public-user-menu";

type PublicGrowthShellProps = {
  children: ReactNode;
  currentUser?: {
    name: string;
    username?: string | null;
  } | null;
};

const navigation = [
  {
    href: "/",
    label: "Ana Sayfa",
  },
  {
    href: "/discover",
    label: "Keşfet",
  },
  {
    href: "/lists",
    label: "Listeler",
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
}: PublicGrowthShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = query.trim();

    if (!value) {
      return;
    }

    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_8%,rgba(201,255,237,0.7),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(222,239,255,0.75),transparent_30%),linear-gradient(180deg,#fffdf9_0%,#f8fbff_55%,#f5f8fb_100%)] pb-32 text-foreground">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-2xl">
        <div className="mx-auto grid min-h-[72px] w-full max-w-[1600px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:min-h-[76px] sm:gap-4 sm:px-5 lg:px-8">
          <Link
            className="shrink-0 text-base font-black tracking-[0.13em] text-[#087d70] sm:text-lg sm:tracking-[0.15em]"
            href="/"
          >
            RADARUNE
          </Link>

          <div className="flex min-w-0 justify-center">
            <div className="flex w-full max-w-[860px] items-center rounded-full border border-black/5 bg-white px-1.5 py-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] sm:px-2">
              <nav
                aria-label="Ana menü"
                className="hidden shrink-0 items-center gap-1 lg:flex"
              >
                {navigation.map((item) => {
                  const active = isActiveRoute(pathname, item.href);

                  return (
                    <Link
                      className={
                        active
                          ? "rounded-full bg-[#0b8274]/10 px-5 py-2.5 text-sm font-semibold text-[#087d70]"
                          : "rounded-full px-5 py-2.5 text-sm font-semibold text-black/65 transition hover:bg-black/[0.04] hover:text-black"
                      }
                      href={item.href}
                      key={item.href}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mx-2 hidden h-7 w-px bg-black/10 lg:block" />

              <form
                className="flex min-w-0 flex-1 items-center"
                onSubmit={submitSearch}
              >
                <input
                  aria-label="Site içinde ara"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-black/35 sm:px-4"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Şarkı, sanatçı veya albüm ara..."
                  value={query}
                />

                <button
                  aria-label="Ara"
                  className="mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-black/60 transition hover:bg-black/5 hover:text-black"
                  type="submit"
                >
                  <Search className="size-4" />
                </button>
              </form>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
            {currentUser ? (
              <>
                <NotificationBell />

                <PublicUserMenu currentUser={currentUser} />
              </>
            ) : (
              <Link
                className="whitespace-nowrap rounded-full bg-[#111111] px-3.5 py-2.5 text-xs font-semibold text-white sm:px-5 sm:text-sm"
                href={`/sign-in?next=${encodeURIComponent(
                  pathname || "/discover",
                )}`}
              >
                Giriş yap
              </Link>
            )}
          </div>
        </div>

        <nav
          aria-label="Mobil ana menü"
          className="flex items-center justify-center gap-1 border-t border-black/5 px-3 py-2 lg:hidden"
        >
          {navigation.map((item) => {
            const active = isActiveRoute(pathname, item.href);

            return (
              <Link
                className={
                  active
                    ? "rounded-full bg-[#0b8274]/10 px-4 py-2 text-xs font-semibold text-[#087d70]"
                    : "rounded-full px-4 py-2 text-xs font-semibold text-black/60 transition hover:bg-black/[0.04]"
                }
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="mx-auto w-full max-w-[1500px] px-3 py-6 sm:px-5 sm:py-8 lg:px-7">
        {children}
      </div>
    </main>
  );
}
