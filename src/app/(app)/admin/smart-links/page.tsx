import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { smartLinkService } from "@/features/growth/server/services/smart-link.service";

export default async function AdminSmartLinksPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const links = await smartLinkService.list(actor);

  return <AdminShell title="Smart Link yönetimi" description="Spotify, Apple Music ve diğer platform bağlantılarını tek bir paylaşılabilir sayfada yönetin.">
    <div className="space-y-5">
      <div className="flex justify-end"><Button><Link href="/smart-links/new">Yeni Smart Link</Link></Button></div>
      <section className="grid gap-3">
        {links.length === 0 ? <div className="panel p-10 text-center"><p className="font-semibold">Henüz Smart Link yok</p><p className="mt-2 text-sm text-muted">Yeni bir kampanya oluşturduğunuzda burada listelenir.</p></div> : links.map((link) => <Link className="panel block p-5 transition hover:-translate-y-0.5 hover:border-accent" href={`/smart-links/${link.id}`} key={link.id}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">{link.title}</h2><p className="mt-1 text-sm text-muted">/{link.slug} · {link.artist.name}</p></div><span className="rounded-full border border-line bg-surface-strong px-3 py-1 text-xs font-semibold">{link.active ? "Aktif" : "Pasif"}</span></div></Link>)}
      </section>
    </div>
  </AdminShell>;
}
