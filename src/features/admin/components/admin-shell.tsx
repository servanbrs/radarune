import Link from "next/link";
import type { ReactNode } from "react";

const adminNavigationGroups = [
  {
    title: "Genel",
    items: [
      { href: "/admin", label: "Genel Bakış" },
      { href: "/admin/users", label: "Kullanıcılar" },
      { href: "/admin/users/new", label: "Kullanıcı ekle" },
      { href: "/admin/artists", label: "Sanatçılar" },
      { href: "/admin/applications", label: "Başvurular" },
    ],
  },
  {
    title: "Yayın ve dağıtım",
    items: [
      { href: "/admin/releases", label: "Yayın Moderasyonu" },
      { href: "/admin/moderation", label: "Moderatör paneli" },
      { href: "/admin/distribution", label: "Dağıtım" },
      { href: "/admin/providers", label: "Providerlar" },
      { href: "/admin/import-sources", label: "Otomatik Import" },
      { href: "/admin/import-review", label: "Import İnceleme" },
    ],
  },
  {
    title: "Finans",
    items: [
      { href: "/admin/finance", label: "Finans Yönetimi" },
    ],
  },
  {
    title: "İçerik ve büyüme",
    items: [
      {
        href: "/admin/social/playlists",
        label: "Global Playlistler",
      },
      {
        href: "/admin/intelligence",
        label: "Yapay Zekâ Yönetimi",
      },
      {
        href: "/admin/site-builder",
        label: "Site Builder",
      },
    ],
  },
  {
    title: "Entegrasyonlar",
    items: [
      {
        href: "/admin/integrations/youtube",
        label: "YouTube",
      },
      {
        href: "/admin/integrations/spotify",
        label: "Spotify",
      },
      {
        href: "/admin/storage",
        label: "Dosya Depolama",
      },
      {
        href: "/admin/api-keys",
        label: "Public API",
      },
      {
        href: "/admin/webhooks",
        label: "Webhooks",
      },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/admin/settings", label: "Site Ayarları" },
      { href: "/admin/audit-logs", label: "İşlem Kayıtları" },
      { href: "/admin/system-logs", label: "Sistem Logları" },
      {
        href: "/admin/system/health",
        label: "Sistem Doktoru",
      },
    ],
  },
] as const;

function AdminNavigation() {
  return (
    <nav
      aria-label="Admin menüsü"
      className="grid gap-6"
    >
      {adminNavigationGroups.map((group) => (
        <section key={group.title}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
            {group.title}
          </p>

          <div className="mt-2 grid gap-1">
            {group.items.map((item) => (
              <Link
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-white hover:text-foreground"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </nav>
  );
}

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
    <main className="page-shell min-w-0 bg-[#0b1114] text-[#eef7f5]" data-admin-theme="dark">
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#26383a] bg-[#111d20] px-4 py-3"><span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#44c7ad]">Yönetim</span><Link className="text-sm font-semibold text-[#9aada9] hover:text-[#eef7f5]" href="/dashboard">Çalışma alanına dön →</Link></div>
      <div className="grid min-w-0 w-full gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        {/* Admin sidebar */}
        <aside className="panel sticky top-24 block h-fit max-h-[calc(100vh-7rem)] overflow-y-auto p-4">
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
          <header className="panel min-w-0 p-5 sm:p-6 md:p-8">
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
