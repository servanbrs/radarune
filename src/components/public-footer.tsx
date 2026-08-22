import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getRequestLocale } from "@/lib/i18n-server";
import { normalizeLocale, t } from "@/lib/i18n";

export async function PublicFooter({ locale }: { locale?: string } = {}) {
  const activeLocale = normalizeLocale(locale ?? (await getRequestLocale()));
  return (
    <footer className="border-t border-line/70 bg-surface/70">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/" className="shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-accent">Radarune</p>
          <p className="text-sm font-semibold">Music Platform</p>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted" aria-label="Footer menu">
          <Link className="transition hover:text-foreground" href="/about">{t(activeLocale, "about")}</Link>
          <Link className="transition hover:text-foreground" href="/contact">{t(activeLocale, "contact")}</Link>
          <Link className="transition hover:text-foreground" href="/terms">{t(activeLocale, "terms")}</Link>
          <Link className="transition hover:text-foreground" href="/privacy">{t(activeLocale, "privacy")}</Link>
        </nav>
        <LanguageSwitcher locale={activeLocale} />
      </div>
    </footer>
  );
}
