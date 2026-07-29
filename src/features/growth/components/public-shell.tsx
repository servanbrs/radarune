import type { ReactNode } from "react";
import Link from "next/link";
import { GlobalSearch } from "@/components/global-search";

export function PublicGrowthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dff7ec,transparent_34%),linear-gradient(135deg,#fffaf0,#eef5ff)] px-5 py-6 text-foreground">
      <header className="mx-auto mb-8 flex max-w-6xl items-center justify-between gap-4 rounded-2xl border border-line bg-surface/85 px-4 py-3 shadow-sm backdrop-blur">
        <Link className="shrink-0 font-semibold tracking-[0.2em] text-accent" href="/">RADARUNE</Link>
        <GlobalSearch />
        <nav className="hidden gap-4 text-sm font-medium text-muted md:flex"><Link href="/discover">Keşfet</Link><Link href="/about">Hakkımızda</Link><Link href="/contact">İletişim</Link></nav>
        <Link className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-white" href="/sign-in">Giriş yap</Link>
      </header>
      <div className="mx-auto w-full max-w-4xl">{children}</div>
    </main>
  );
}
