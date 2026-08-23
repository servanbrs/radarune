import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export async function PublicHeader() {
  const locale = await getRequestLocale();
  return (
    <header data-scroll-hide className="sticky top-0 z-50 border-b border-line/70 bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-[1600px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent sm:text-[11px]">Radarune</p>
          <p className="hidden text-sm font-semibold sm:block">Music Platform</p>
        </Link>
        <nav className="flex items-center gap-0.5 text-xs sm:gap-1 sm:text-sm" aria-label="Main menu">
          <Link className="rounded-xl px-2 py-2 text-muted hover:bg-background sm:px-3" href="/">{t(locale, "home")}</Link>
          <Link className="rounded-xl px-2 py-2 text-muted hover:bg-background sm:px-3" href="/discover">{t(locale, "discover")}</Link>
          <Link className="rounded-xl px-2 py-2 text-muted hover:bg-background sm:px-3" href="/lists">{t(locale, "lists")}</Link>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <LanguageSwitcher locale={locale} />
          <Link className="hidden rounded-full border border-line px-4 py-2 text-sm font-semibold sm:inline-flex" href="/sign-in">{t(locale, "login")}</Link>
          <Link className="rounded-full bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground sm:px-4 sm:text-sm" href="/sign-up">{t(locale, "signup")}</Link>
        </div>
      </div>
    </header>
  );
}
