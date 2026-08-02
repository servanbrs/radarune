import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { preSaveService } from "@/features/growth/server/services/presave.service";

export default async function AdminPreSavesPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const campaigns = await preSaveService.list(actor);

  return <AdminShell title="Pre-save kampanyaları" description="Yeni yayınlar için ön kayıt kampanyalarını, sanatçı bağlantılarını ve hayran dönüşümünü yönetin.">
    <div className="space-y-5">
      <div className="flex justify-end"><Button><Link href="/presaves/new">Yeni kampanya</Link></Button></div>
      <section className="grid gap-3">
        {campaigns.length === 0 ? <div className="panel p-10 text-center"><p className="font-semibold">Henüz Pre-save kampanyası yok</p><p className="mt-2 text-sm text-muted">Yeni kampanya oluşturduğunuzda burada listelenir.</p></div> : campaigns.map((campaign) => <Link className="panel block p-5 transition hover:-translate-y-0.5 hover:border-accent" href={`/presaves/${campaign.id}`} key={campaign.id}><h2 className="text-lg font-semibold">{campaign.name}</h2><p className="mt-1 text-sm text-muted">/{campaign.slug} · {campaign.artist.name} · {campaign.release.title}</p></Link>)}
      </section>
    </div>
  </AdminShell>;
}
