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
      <section className="panel flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Smart Link</p>
          <h1 className="mt-3 text-3xl font-semibold">Akıllı bağlantılar</h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-muted">Spotify, Apple Music ve tüm platformlarınızı tek bir SEO uyumlu sayfada birleştirin.</p>
        </div>
        <Button><Link href="/smart-links/new">Yeni Smart Link</Link></Button>
      </section>
      <section className="grid gap-4">
        {links.map((link) => (
          <Link className="panel block p-5 transition hover:bg-white" href={`/smart-links/${link.id}`} key={link.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{link.title}</h2>
                <p className="mt-1 text-sm text-muted">/{link.slug} · {link.artist.name}</p>
              </div>
              <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold">
                {link.active ? "Aktif" : "Pasif"}
              </span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
