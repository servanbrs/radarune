import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { smartLinkService } from "@/features/growth/server/services/smart-link.service";

export default async function SmartLinksPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
  const links = await smartLinkService.list(actor);

  return (
    <main className="page-shell">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a1715] p-6 text-white shadow-[0_24px_90px_rgba(4,15,13,0.18)] md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div>
          <p className="relative text-xs uppercase tracking-[0.24em] text-emerald-300">Creator growth / Smart Link</p>
          <h1 className="mt-3 text-3xl font-semibold">Akıllı bağlantılar</h1>
          <p className="relative mt-2 max-w-xl text-sm leading-7 text-white/55">Spotify, Apple Music ve tüm platformlarınızı tek bir SEO uyumlu sayfada birleştirin.</p>
        </div>
        <Button className="relative"><Link href="/smart-links/new">Yeni Smart Link</Link></Button>
      </section>
      <section className="grid grid-cols-3 gap-3"><div className="panel p-4"><p className="text-xs text-muted">Aktif</p><p className="mt-2 text-2xl font-semibold">{links.filter((link) => link.active).length}</p></div><div className="panel p-4"><p className="text-xs text-muted">Görüntülenme</p><p className="mt-2 text-2xl font-semibold">{links.reduce((total, link) => total + link._count.views, 0).toLocaleString("tr-TR")}</p></div><div className="panel p-4"><p className="text-xs text-muted">Tıklama</p><p className="mt-2 text-2xl font-semibold">{links.reduce((total, link) => total + link._count.clicks, 0).toLocaleString("tr-TR")}</p></div></section>
      <section className="grid gap-4">
        {links.map((link) => (
          <Link className="panel block p-5 transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lg" href={`/smart-links/${link.id}`} key={link.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{link.title}</h2>
                <p className="mt-1 text-sm text-muted">/{link.slug} · {link.artist.name} · {link.platforms.length} platform</p>
              </div>
              <span className="rounded-full border border-line bg-surface-strong px-3 py-1 text-xs font-semibold">
                {link.active ? "Aktif" : "Pasif"}
              </span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
