import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-[1600px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent sm:text-[11px]">Radarune</p>
          <p className="hidden text-sm font-semibold sm:block">Music Platform</p>
        </Link>
        <nav className="flex items-center gap-0.5 text-xs sm:gap-1 sm:text-sm" aria-label="Ana menü">
          <Link className="rounded-xl px-2 py-2 text-muted hover:bg-background sm:px-3" href="/">Ana Sayfa</Link>
          <Link className="rounded-xl px-2 py-2 text-muted hover:bg-background sm:px-3" href="/discover">Keşfet</Link>
          <Link className="rounded-xl px-2 py-2 text-muted hover:bg-background sm:px-3" href="/lists">Listeler</Link>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Link className="hidden rounded-full border border-line px-4 py-2 text-sm font-semibold sm:inline-flex" href="/sign-in">Giriş yap</Link>
          <Link className="rounded-full bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground sm:px-4 sm:text-sm" href="/sign-up">Başlayın</Link>
        </div>
      </div>
    </header>
  );
}
