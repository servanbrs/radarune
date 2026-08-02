import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { preSaveService } from "@/features/growth/server/services/presave.service";

export default async function PreSavesPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
  const campaigns = await preSaveService.list(actor);

  return (
    <main className="page-shell">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a1715] p-6 text-white shadow-[0_24px_90px_rgba(4,15,13,0.18)] md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div>
          <p className="relative text-xs uppercase tracking-[0.24em] text-emerald-300">Creator workspace / Fan growth</p>
          <h1 className="mt-3 text-3xl font-semibold">Ön kayıt kampanyaları</h1>
          <p className="relative mt-2 max-w-xl text-sm leading-7 text-white/55">Yeni yayınlarınızı duyurun, hayranlarınızdan güvenli ön kayıt toplayın.</p>
        </div>
        <Button className="relative mt-5 md:absolute md:right-8 md:top-8"><Link href="/presaves/new">Yeni kampanya</Link></Button>
      </section>
      <section className="grid gap-4">
        {campaigns.map((campaign) => (
          <Link className="panel block p-5 transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lg" href={`/presaves/${campaign.id}`} key={campaign.id}>
            <h2 className="text-lg font-semibold">{campaign.name}</h2>
            <p className="mt-1 text-sm text-muted">/{campaign.slug} · {campaign.artist.name} · {campaign.release.title}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
