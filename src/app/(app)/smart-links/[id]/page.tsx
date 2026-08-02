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
  const clickRate = link._count.views ? ((link._count.clicks / link._count.views) * 100).toFixed(1) : "0.0";
  const topPlatform = [...link.platforms].sort((left, right) => right.clickCount - left.clickCount)[0];

  return (
    <main className="page-shell">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a1715] p-6 text-white shadow-[0_24px_90px_rgba(4,15,13,0.18)] md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <p className="relative text-xs uppercase tracking-[0.24em] text-emerald-300">Creator growth / Smart Link</p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="text-3xl font-semibold">{link.title}</h1><p className="mt-2 text-sm text-white/55">/{link.slug} · {link.artist.name}</p></div>
          <div className="relative flex flex-wrap gap-2"><Link className="rounded-xl bg-emerald-300 px-4 py-2 text-sm font-bold text-[#08201a]" href={`/l/${link.slug}`}>Public sayfa ↗</Link><Link className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white" href={`/smart-links/${link.id}/edit`}>Düzenle</Link></div>
        </div>
        {link.description ? <p className="mt-6 max-w-2xl leading-7 text-white/60">{link.description}</p> : null}
        <div className="relative mt-8 grid gap-3 sm:grid-cols-4"><article className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><p className="text-xs uppercase tracking-[0.18em] text-white/40">Görüntülenme</p><p className="mt-2 text-2xl font-semibold">{link._count.views}</p></article><article className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><p className="text-xs uppercase tracking-[0.18em] text-white/40">Tıklama</p><p className="mt-2 text-2xl font-semibold">{link._count.clicks}</p></article><article className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><p className="text-xs uppercase tracking-[0.18em] text-white/40">Tıklama oranı</p><p className="mt-2 text-2xl font-semibold text-emerald-300">%{clickRate}</p></article><article className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><p className="text-xs uppercase tracking-[0.18em] text-white/40">En iyi platform</p><p className="mt-2 truncate text-lg font-semibold">{topPlatform?.platform ?? "—"}</p></article></div>
      </section>
      <section className="panel p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">Yayın hedefleri</h2><p className="mt-1 text-sm text-muted">Platform bazlı tıklama performansı.</p></div><Link className="text-sm font-semibold text-accent" href={`/l/${link.slug}`}>Public linki aç</Link></div><div className="mt-4 grid gap-3">{link.platforms.map((platform) => <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface-strong/40 p-4" key={platform.id}><span className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-xs font-bold text-accent">{platform.platform.slice(0, 2)}</span><div className="min-w-0 flex-1"><p className="font-semibold">{platform.buttonText ?? platform.platform}</p><a className="block max-w-full truncate text-xs text-muted hover:text-foreground" href={platform.url} rel="noreferrer" target="_blank">{platform.url}</a></div><span className="shrink-0 text-xs font-semibold text-muted">{platform.clickCount} tıklama</span></div>)}</div></section>
    </main>
  );
}
