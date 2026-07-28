import Link from "next/link";
import type { ReactNode } from "react";
import { AdminNavigation } from "./admin-navigation";

export function AdminShell({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <main className="admin-theme page-shell min-w-0 flex-col bg-background text-foreground" data-admin-theme="auto">
      <div className="admin-context-bar mb-5 flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3"><span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Yönetim</span><Link className="text-sm font-semibold text-muted hover:text-foreground" href="/dashboard">Çalışma alanına dön →</Link></div>
      <div className="grid min-w-0 w-full gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        {/* Admin sidebar */}
        <aside className="panel admin-sidebar sticky top-24 block h-fit max-h-[calc(100vh-7rem)] overflow-y-auto bg-surface p-4 text-foreground">
          <div className="border-b border-line px-3 pb-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Radarune
            </p>

            <p className="mt-1 text-lg font-semibold">
              Admin Paneli
            </p>
          </div>

          <div className="mt-5">
            <AdminNavigation />
          </div>
        </aside>

        {/* Sayfa içeriği */}
        <section className="flex min-w-0 flex-col gap-5">
          <header className="panel admin-page-header min-w-0 bg-surface p-5 text-foreground sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Radarune Yönetim
            </p>

            <h1 className="mt-3 break-words text-2xl font-semibold sm:text-3xl">
              {title}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              {description}
            </p>
          </header>

          <div className="min-w-0">{children}</div>
        </section>
      </div>
    </main>
  );
}
