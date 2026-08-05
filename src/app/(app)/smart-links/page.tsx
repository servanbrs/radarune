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
      <section className="grid gap-4 md:grid-cols-3"><div className="rounded-[1.5rem] border border-emerald-900/10 bg-[#e8fff6] p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Aktif link</p><p className="mt-2 text-3xl font-black text-[#10201d]">{links.filter((link) => link.active).length}</p><p className="mt-1 text-xs text-emerald-900/60">Ziyaretçilerin açabildiği sayfalar</p></div><div className="rounded-[1.5rem] border border-blue-900/10 bg-[#eef5ff] p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-800">Görüntülenme</p><p className="mt-2 text-3xl font-black text-[#10201d]">{links.reduce((total, link) => total + link._count.views, 0).toLocaleString("tr-TR")}</p><p className="mt-1 text-xs text-blue-900/60">Smart Link sayfa ziyaretleri</p></div><div className="rounded-[1.5rem] border border-orange-900/10 bg-[#fff4df] p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-800">Platform tıklaması</p><p className="mt-2 text-3xl font-black text-[#10201d]">{links.reduce((total, link) => total + link._count.clicks, 0).toLocaleString("tr-TR")}</p><p className="mt-1 text-xs text-orange-900/60">Spotify, YouTube ve diğer hedefler</p></div></section>
      <section className="grid gap-4 md:grid-cols-2">
        {links.map((link) => (
          <Link className="group overflow-hidden rounded-[1.75rem] border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-xl" href={`/smart-links/${link.id}`} key={link.id}>
            <div className="flex items-center gap-4"><div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-emerald-100 text-xl font-black text-emerald-800">{link.artist.profileImageUrl ? <img alt={`${link.artist.name} profil fotoğrafı`} className="size-full object-cover" src={link.artist.profileImageUrl} /> : link.artist.name.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h2 className="truncate text-lg font-bold">{link.title}</h2><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${link.active ? "bg-emerald-100 text-emerald-800" : "bg-black/[0.06] text-muted"}`}>{link.active ? "Aktif" : "Taslak"}</span></div><p className="mt-1 truncate text-sm text-muted">{link.artist.name} · /{link.slug}</p></div></div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-xs"><span><b className="block text-sm text-foreground">{link.platforms.length}</b>platform</span><span><b className="block text-sm text-foreground">{link._count.views}</b>görüntülenme</span><span><b className="block text-sm text-foreground">{link._count.clicks}</b>tıklama</span></div>
          </Link>
        ))}
      </section>
    </main>
  );
}
