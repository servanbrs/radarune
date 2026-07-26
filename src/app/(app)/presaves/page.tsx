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
      <section className="panel flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Pre-save</p>
          <h1 className="mt-3 text-3xl font-semibold">Pre-save kampanyaları</h1>
        </div>
        <Button><Link href="/presaves/new">Yeni kampanya</Link></Button>
      </section>
      <section className="grid gap-4">
        {campaigns.map((campaign) => (
          <Link className="panel block p-5 transition hover:bg-white" href={`/presaves/${campaign.id}`} key={campaign.id}>
            <h2 className="text-lg font-semibold">{campaign.name}</h2>
            <p className="mt-1 text-sm text-muted">/{campaign.slug} · {campaign.artist.name} · {campaign.release.title}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
