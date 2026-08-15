import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, CircleHelp, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { AdminNavigation } from "./admin-navigation";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";

export async function AdminShell({
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
  const { user } = await authSessionService.getDashboardContext();
  return (
    <main className="admin-theme min-h-screen min-w-0 bg-[#0b1020] text-white" data-admin-theme="dark">
      <div className="mx-auto flex min-h-screen w-full max-w-[1920px]">
        <aside className="hidden w-[276px] shrink-0 border-r border-white/[0.08] bg-[#0d1324] lg:flex lg:flex-col">
          <div className="flex h-[86px] items-center border-b border-white/[0.08] px-6">
            <Link className="flex items-center gap-3" href="/admin">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-[#d6a85f] text-[#17120b] shadow-[0_8px_24px_rgba(214,168,95,0.2)]"><Sparkles className="size-5" /></span>
              <span><span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#d6a85f]">Radarune</span><span className="mt-0.5 block text-sm font-semibold text-white">Operations</span></span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5"><AdminNavigation systemRole={user.systemRole} /></div>
          <div className="border-t border-white/[0.08] p-4">
            <div className="rounded-2xl border border-[#d6a85f]/25 bg-[#d6a85f]/[0.07] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#e5bd7b]"><ShieldCheck className="size-4" /> Güvenli çalışma alanı</div>
              <p className="mt-2 text-[11px] leading-5 text-[#b7c2d0]">Tenant izolasyonu ve audit kayıtları aktif.</p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 bg-[#10162a] text-[#f1f3f8]">
          <header className="sticky top-0 z-20 flex min-h-[86px] items-center justify-between border-b border-white/[0.08] bg-[#10162a]/95 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
            <div className="min-w-0"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#e5bd7b]"><span>Radarune</span><ChevronRight className="size-3" /><span>Admin</span></div><p className="mt-1 truncate text-sm font-semibold text-white">{title}</p></div>
            <div className="flex items-center gap-2 sm:gap-3"><span className="hidden items-center gap-2 rounded-full border border-[#d6a85f]/25 bg-[#d6a85f]/[0.1] px-3 py-2 text-xs font-semibold text-[#e5bd7b] md:flex"><span className="size-2 animate-pulse rounded-full bg-[#d6a85f]" /> Sistemler normal</span><Link aria-label="Yardım ve destek merkezini aç" className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-[#18243a] text-[#e5bd7b] transition hover:border-[#d6a85f]/50 hover:bg-[#243452]" href="/admin/support" title="Yardım ve destek"><CircleHelp className="size-4" /></Link><Link className="hidden items-center gap-2 rounded-xl bg-[#d6a85f] px-3 py-2 text-xs font-bold !text-[#17120b] transition hover:bg-[#e5bd7b] sm:flex" href="/">Anasayfayı gör <ExternalLink className="size-3.5" /></Link></div>
          </header>
          <div className="border-b border-white/[0.08] bg-[#0d1324] px-4 py-3 lg:hidden"><AdminNavigation systemRole={user.systemRole} /></div>
          <div className="min-w-0 px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
            {showIntro ? <div className="mb-6 max-w-4xl"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d6a85f]">Operations workspace</p><h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{title}</h1><p className="mt-2 text-sm leading-6 text-[#b7c2d0]">{description}</p></div> : null}
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
