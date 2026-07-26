import Link from "next/link";
import type { ReactNode } from "react";

const adminLinks = [
  { href: "/admin", label: "Genel Bakış" },
  { href: "/admin/users", label: "Kullanıcılar" },
  { href: "/admin/artists", label: "Sanatçılar" },
  { href: "/admin/applications", label: "Başvurular" },
  { href: "/admin/releases", label: "Yayın Moderasyonu" },
  { href: "/admin/distribution", label: "Distribution" },
  { href: "/admin/providers", label: "Providerlar" },
  { href: "/admin/audit-logs", label: "Audit Log" },
  { href: "/admin/system-logs", label: "System Log" },
  { href: "/admin/settings", label: "Ayarlar" },
  { href: "/admin/finance", label: "Finans" },
  { href: "/admin/intelligence", label: "AI Intelligence" },
  { href: "/admin/social/playlists", label: "Global playlistler" },
  { href: "/admin/site-builder", label: "Site Builder" },
  { href: "/admin/api-keys", label: "Public API" },
  { href: "/admin/webhooks", label: "Webhooks" },
  { href: "/admin/system/health", label: "System Doctor" },
  { href: "/admin/settings/storage", label: "Storage" },
  { href: "/admin/integrations/youtube", label: "YouTube entegrasyonu" },
  { href: "/admin/integrations/spotify", label: "Spotify entegrasyonu" },
  { href: "/admin/import-sources", label: "Otomatik import" },
  { href: "/admin/import-review", label: "Import inceleme" },
];

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
    <main className="page-shell">
      <div className="grid w-full gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="panel h-fit p-4">
          <p className="px-3 py-2 text-xs uppercase tracking-[0.24em] text-muted">
            Admin Panel
          </p>
          <nav className="mt-2 grid gap-1">
            {adminLinks.map((item) => (
              <Link
                className="rounded-2xl px-3 py-2 text-sm font-semibold text-muted transition hover:bg-white hover:text-foreground"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="flex min-w-0 flex-col gap-6">
          <div className="panel p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Radarune</p>
            <h1 className="mt-3 text-3xl font-semibold">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{description}</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
