import Link from "next/link";
import { ArrowUpRight, Menu, RadioTower } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { getRequestLocale } from "@/lib/i18n-server";
import { normalizeLocale, t } from "@/lib/i18n";

const navigation = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Dağıtım", href: "#distribution" },
  { label: "Nasıl Çalışır?", href: "#workflow" },
  { label: "Keşfet", href: "/discover" },
] as const;

export async function LandingNavbar() {
  const locale = normalizeLocale(await getRequestLocale());
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080a0e]/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-6 px-5 md:px-10">
        <Link
          href="/"
          aria-label="Radarune ana sayfa"
          className="group flex items-center gap-3"
        >
          <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-2xl border border-amber-300/30 bg-gradient-to-br from-amber-300 to-amber-500 text-[#080a0e] shadow-[0_0_35px_rgba(251,191,36,0.18)]">
            <RadioTower className="h-5 w-5" aria-hidden="true" />
          </span>

          <span>
            <span className="block text-sm font-semibold tracking-[0.24em] text-white">
              RADARUNE
            </span>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-white/35">
              Music Distribution
            </span>
          </span>
        </Link>

        <nav
          aria-label="Ana navigasyon"
          className="hidden items-center gap-8 lg:flex"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-white/55 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <LanguageSwitcher locale={locale} />
            <ThemeToggle />
          </div>

          <Link
            href="/sign-in"
            className="hidden rounded-full px-4 py-2.5 text-sm font-medium text-white/65 transition hover:text-white md:inline-flex"
          >
            {t(locale, "login")}
          </Link>

          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#080a0e] transition hover:bg-amber-300"
          >
            {t(locale, "signup")}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <button
            type="button"
            aria-label="Menüyü aç"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/70 lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
