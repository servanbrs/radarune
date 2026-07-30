import Link from "next/link";
import { Music2 } from "lucide-react";

import { toAdminActor } from "@/features/admin/server/admin-context";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { DiscoverFeedClient } from "@/features/growth/components/discover-feed-client";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import { discoverService } from "@/features/growth/server/services/discover.service";

export default async function DiscoverPage() {
  const session = await authSessionService.getOptionalSession();
  const dashboard = session ? await authSessionService.getDashboardContext() : null;
  const actor = dashboard
    ? toAdminActor({
        organizationId: dashboard.organization.organization.id,
        membershipRole: dashboard.organization.role,
        systemRole: dashboard.user.systemRole,
        userId: dashboard.user.id,
      })
    : undefined;
  const feed = await discoverService.getFeed(actor);

  return (
    <PublicGrowthShell>
      <section className="mx-auto max-w-2xl pt-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Radarune Keşfet</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">Müziği kaydırarak keşfet.</h1>
        <p className="mt-3 text-sm leading-7 text-muted">Kapak görseline dokunup dinleyin. Sağa kaydırın ve beğenin, sola kaydırın veya aşağı geçin.</p>
      </section>
      {feed.length ? <DiscoverFeedClient feed={feed} isAuthenticated={Boolean(session)} /> : <section className="mt-6 rounded-[2rem] border border-dashed border-line bg-surface px-6 py-16 text-center"><Music2 className="mx-auto size-8 text-accent" /><h2 className="mt-5 text-2xl font-semibold">Keşfet havuzu henüz boş</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">İlk yayınlar ve onaylanmış importlar burada görünecek.</p><Link className="mt-7 inline-flex rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white" href={session ? "/releases/new" : "/sign-up"}>{session ? "Yeni yayın oluştur" : "Ücretsiz üye ol"}</Link></section>}
    </PublicGrowthShell>
  );
}
