import Link from "next/link";
import {
  ArrowUpRight,
  Compass,
  Flame,
  Music2,
  Sparkles,
} from "lucide-react";

import { toAdminActor } from "@/features/admin/server/admin-context";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { creatorAccessService } from "@/features/authorization/server/creator-access.service";
import { DiscoverFeedClient } from "@/features/growth/components/discover-feed-client";
import { discoverService } from "@/features/growth/server/services/discover.service";

export default async function DiscoverPage() {
  const session = await authSessionService.getOptionalSession();
  const dashboard = session ? await authSessionService.getDashboardContext() : null;
  const discoverActor = dashboard
    ? toAdminActor({
        organizationId: dashboard.organization.organization.id,
        membershipRole: dashboard.organization.role,
        systemRole: dashboard.user.systemRole,
        userId: dashboard.user.id,
      })
    : undefined;
  const creatorAccess = creatorAccessService.getAccess({
    systemRole: dashboard?.user.systemRole ?? "USER",
  });

  const feed = await discoverService.getFeed(discoverActor);

  const radaruneCount = feed.filter(
    (item) => item.provider === "RADARUNE",
  ).length;

  const externalCount = feed.length - radaruneCount;

  return (
    <main className="page-shell pb-28">
      <div className="w-full">
        <section className="relative overflow-hidden rounded-[2rem] border border-line bg-[#10201f] px-6 py-9 text-white shadow-[0_24px_80px_rgba(15,50,47,0.22)] md:px-10 md:py-12">
          <div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full bg-[#efb848]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-[20%] size-72 rounded-full bg-accent/30 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <Compass className="size-3.5" />
                Radarune Keşfet
              </div>

              <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] md:text-6xl">
                Yeni müziği herkesten önce keşfet.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/60 md:text-lg">
                Radarune yayınları, YouTube müzikleri ve
                Spotify seçkileri tek bir keşif akışında.
              </p>
            </div>

            <div className="grid min-w-[260px] grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <p className="text-2xl font-semibold">
                  {radaruneCount}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  Radarune yayını
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <p className="text-2xl font-semibold">
                  {externalCount}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  Dış kaynak
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              <Flame className="size-4" />
              Güncel sıralama
            </div>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              Keşfet akışı
            </h2>

            <p className="mt-2 text-sm text-muted">
              Yeni Radarune yayınları öncelikli, güncel
              YouTube ve Spotify içerikleri destekleyici
              olarak sıralanır.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-muted">
            <Sparkles className="size-4 text-accent" />
            {feed.length} içerik hazır
          </div>
        </section>

        {feed.length > 0 ? (
          <DiscoverFeedClient feed={feed} />
        ) : (
          <section className="mt-6 rounded-[2rem] border border-dashed border-line bg-surface px-6 py-16 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Music2 className="size-6" />
            </div>

            <h2 className="mt-5 text-2xl font-semibold">
              Keşfet havuzu henüz boş
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
              Admin panelinden YouTube veya Spotify import
              kaynağı eklenip çalıştırıldığında içerikler
              burada otomatik olarak görüntülenecek.
            </p>

            <Link
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white"
              href={
                !session
                  ? "/sign-up"
                  : creatorAccess.canCreateReleases
                  ? "/releases/new"
                  : "/become"
              }
            >
              {!session
                ? "Üye ol ve etkileşime geç"
                : creatorAccess.canCreateReleases
                ? "Yeni yayın oluştur"
                : "Sanatçı başvurusu yap"}

              <ArrowUpRight className="size-4" />
            </Link>
          </section>
        )}

      </div>
    </main>
  );
}
