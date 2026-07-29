import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";

export function PublicFooter() {
  return (
    <footer className="border-t border-line/70 bg-surface/70">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/" className="shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-accent">Radarune</p>
          <p className="text-sm font-semibold">Music Platform</p>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted" aria-label="Alt menü">
          <Link className="transition hover:text-foreground" href="/about">Hakkımızda</Link>
          <Link className="transition hover:text-foreground" href="/contact">İletişim</Link>
          <Link className="transition hover:text-foreground" href="/terms">Kullanım koşulları</Link>
          <Link className="transition hover:text-foreground" href="/privacy">Gizlilik</Link>
        </nav>
        <LanguageSwitcher locale="tr-TR" />
      </div>
    </footer>
  );
}
