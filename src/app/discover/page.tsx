import Link from "next/link";
import { Music2 } from "lucide-react";

import { toAdminActor } from "@/features/admin/server/admin-context";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { DiscoverFeedClient } from "@/features/growth/components/discover-feed-client";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import { discoverService } from "@/features/growth/server/services/discover.service";

export default async function DiscoverPage() {
  const session = await authSessionService.getOptionalSession();

  const dashboard = session
    ? await authSessionService.getDashboardContext()
    : null;

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
      <main className="relative isolate mx-auto min-h-[calc(100vh-4rem)] w-full overflow-hidden pb-36 sm:pb-44">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_14%_10%,rgba(52,211,153,0.18),transparent_32%),radial-gradient(circle_at_84%_8%,rgba(96,165,250,0.15),transparent_34%),linear-gradient(180deg,#f8fffc_0%,#f6f9ff_55%,transparent_100%)]"
        />

        <section className="relative mx-auto max-w-4xl px-1 pb-7 pt-7 text-center sm:px-4 sm:pb-9 sm:pt-11 lg:pt-13">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-xl">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.7)]" />

            <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-700">
              Radarune Discover
            </span>
          </div>

          <h1 className="mx-auto mt-5 max-w-4xl text-balance text-[2.45rem] font-semibold leading-[0.98] tracking-[-0.06em] text-[#101817] sm:text-5xl lg:text-6xl xl:text-7xl">
            Bugünün bilinmeyenleri.
            <span className="block bg-gradient-to-r from-emerald-600 via-[#101817] to-blue-600 bg-clip-text text-transparent">
              Yarının yıldızları.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[#52605d] sm:text-base">
            Yeni şarkıları dinle, kaydır, oy ver ve yükselmesini istediğin
            sanatçıları toplulukla birlikte keşfet.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-black/[0.07] bg-white/70 px-4 py-2 text-xs font-medium text-[#65706e] shadow-sm backdrop-blur">
              ← Önceki
            </span>

            <span className="rounded-full border border-black/[0.07] bg-white/70 px-4 py-2 text-xs font-medium text-[#65706e] shadow-sm backdrop-blur">
              Boşluk · Oynat
            </span>

            <span className="rounded-full border border-black/[0.07] bg-white/70 px-4 py-2 text-xs font-medium text-[#65706e] shadow-sm backdrop-blur">
              Beğen →
            </span>
          </div>
        </section>

        <section className="relative px-0 sm:px-2 lg:px-4">
          {feed.length ? (
            <DiscoverFeedClient
              feed={feed}
              isAuthenticated={Boolean(session)}
            />
          ) : (
            <div className="mx-auto mt-8 max-w-2xl rounded-[2rem] border border-dashed border-black/10 bg-white/80 px-6 py-16 text-center shadow-xl backdrop-blur-xl">
              <Music2 className="mx-auto size-9 text-emerald-600" />

              <h2 className="mt-5 text-2xl font-semibold">
                Keşfet havuzu henüz boş
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
                İlk yayınlar ve onaylanmış importlar burada görünecek.
              </p>

              <Link
                className="mt-7 inline-flex rounded-full bg-[#101817] px-5 py-3 text-sm font-semibold text-white"
                href={session ? "/releases/new" : "/sign-up"}
              >
                {session ? "Yeni yayın oluştur" : "Ücretsiz üye ol"}
              </Link>
            </div>
          )}
        </section>
      </main>
    </PublicGrowthShell>
  );
}
