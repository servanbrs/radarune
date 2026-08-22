import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getRequestLocale } from "@/lib/i18n-server";
import { normalizeLocale, t } from "@/lib/i18n";

type PublicAuthHeaderProps = {
  mode: "sign-in" | "sign-up";
  locale?: string;
};

export async function PublicAuthHeader({ mode, locale }: PublicAuthHeaderProps) {
  const isSignIn = mode === "sign-in";
  const activeLocale = normalizeLocale(locale ?? (await getRequestLocale()));

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-surface/90 text-foreground shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 leading-tight">
          <span className="block text-[0.7rem] font-semibold tracking-[0.3em] text-accent">RADARUNE</span>
          <span className="block text-sm font-semibold">Music Platform</span>
        </Link>

        <nav
          aria-label={t(activeLocale, "homePage")}
          className="hidden items-center gap-3 text-xs font-medium text-muted sm:flex sm:gap-5 sm:text-sm"
        >
          <Link className="transition-colors hover:text-foreground" href="/">{t(activeLocale, "home")}</Link>
          <Link className="transition-colors hover:text-foreground" href="/discover">{t(activeLocale, "discover")}</Link>
          <Link className="transition-colors hover:text-foreground" href="/lists">{t(activeLocale, "lists")}</Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={activeLocale} />
          <ThemeToggle />
          <Link
            className="hidden rounded-full border border-line px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-strong sm:inline-flex"
            href={isSignIn ? "/sign-up" : "/sign-in"}
          >
            {isSignIn ? t(activeLocale, "signup") : t(activeLocale, "login")}
          </Link>
        </div>
      </div>
    </header>
  );
}
