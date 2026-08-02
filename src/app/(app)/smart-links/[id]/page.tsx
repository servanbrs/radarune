import Link from "next/link";
import { notFound } from "next/navigation";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { smartLinkService } from "@/features/growth/server/services/smart-link.service";

export default async function SmartLinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const link = await smartLinkService.getById(actor, id);
  if (!link) notFound();

  return (
    <main className="page-shell">
      <section className="panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Smart Link</p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="text-3xl font-semibold">{link.title}</h1><p className="mt-2 text-sm text-muted">/{link.slug} · {link.artist.name}</p></div>
          <Link className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground" href={`/smart-links/${link.id}/edit`}>Düzenle</Link>
          <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold">{link.active ? "Aktif" : "Taslak"}</span>
        </div>
        {link.description ? <p className="mt-6 max-w-2xl leading-7 text-muted">{link.description}</p> : null}
        <div className="mt-8 grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Görüntülenme</p><p className="mt-2 text-2xl font-semibold">{link._count.views}</p></article><article className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Tıklama</p><p className="mt-2 text-2xl font-semibold">{link._count.clicks}</p></article><article className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Platform</p><p className="mt-2 text-2xl font-semibold">{link.platforms.filter((platform) => platform.active).length}</p></article></div>
      </section>
      <section className="panel p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">Yayın hedefleri</h2><Link className="text-sm font-semibold text-accent" href={`/l/${link.slug}`}>Public linki aç</Link></div><div className="mt-4 grid gap-3">{link.platforms.map((platform) => <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-4" key={platform.id}><span className="font-semibold">{platform.platform}</span><a className="max-w-full truncate text-sm text-muted hover:text-foreground" href={platform.url} rel="noreferrer" target="_blank">{platform.url}</a></div>)}</div></section>
    </main>
  );
}
