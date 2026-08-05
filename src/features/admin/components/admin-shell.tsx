import Link from "next/link";
import type { ReactNode } from "react";
import { Bell, ChevronRight, CircleHelp, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { AdminNavigation } from "./admin-navigation";

export function AdminShell({
  children,
  title,
  description,
  showIntro = true,
}: {
  children: ReactNode;
  title: string;
  description: string;
  showIntro?: boolean;
}) {
  return (
    <main className="admin-theme min-h-screen min-w-0 bg-[#07110f] text-white" data-admin-theme="dark">
      <div className="mx-auto flex min-h-screen w-full max-w-[1920px]">
        <aside className="hidden w-[276px] shrink-0 border-r border-white/[0.08] bg-[#0a1715] lg:flex lg:flex-col">
          <div className="flex h-[86px] items-center border-b border-white/[0.08] px-6">
            <Link className="flex items-center gap-3" href="/admin">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-300 text-[#09221d] shadow-[0_8px_24px_rgba(110,231,183,0.2)]"><Sparkles className="size-5" /></span>
              <span><span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-300">Radarune</span><span className="mt-0.5 block text-sm font-semibold text-white">Operations</span></span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5"><AdminNavigation /></div>
          <div className="border-t border-white/[0.08] p-4">
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200"><ShieldCheck className="size-4" /> Güvenli çalışma alanı</div>
              <p className="mt-2 text-[11px] leading-5 text-white/40">Tenant izolasyonu ve audit kayıtları aktif.</p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 bg-[#0d1c1a] text-[#eef7f5]">
          <header className="sticky top-0 z-20 flex min-h-[86px] items-center justify-between border-b border-white/[0.08] bg-[#0d1c1a]/95 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
            <div className="min-w-0"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/70"><span>Radarune</span><ChevronRight className="size-3" /><span>Admin V2</span></div><p className="mt-1 truncate text-sm font-semibold text-white">{title}</p></div>
            <div className="flex items-center gap-2 sm:gap-3"><span className="hidden items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.08] px-3 py-2 text-xs font-semibold text-emerald-200 md:flex"><span className="size-2 animate-pulse rounded-full bg-emerald-300" /> Sistemler normal</span><Link aria-label="Destek" className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-[#162a27] text-emerald-200 transition hover:border-emerald-300/30 hover:bg-[#1d3832]" href="/admin/support"><CircleHelp className="size-4" /></Link><Link aria-label="Bildirimler" className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-[#162a27] text-emerald-200 transition hover:border-emerald-300/30 hover:bg-[#1d3832]" href="/admin/system/health"><Bell className="size-4" /></Link><a className="hidden items-center gap-2 rounded-xl bg-[#55e3b2] px-3 py-2 text-xs font-bold !text-[#06221a] transition hover:bg-[#82f0c8] sm:flex" href="/dashboard">Panele dön <ExternalLink className="size-3.5" /></a></div>
          </header>
          <div className="border-b border-white/[0.08] bg-[#10221f] px-4 py-3 lg:hidden"><AdminNavigation /></div>
          <div className="min-w-0 px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
            {showIntro ? <div className="mb-6 max-w-4xl"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">Operations workspace</p><h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{title}</h1><p className="mt-2 text-sm leading-6 text-[#64726d]">{description}</p></div> : null}
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
