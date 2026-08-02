import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { ReleaseStatusBadge } from "@/features/releases/components/release-status-badge";
import { releaseService } from "@/features/releases/server/services/release.service";
import { releaseTypeLabels } from "@/features/releases/constants/release.constants";

export default async function ReleasesPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const releases = await releaseService.listReleases({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10 md:px-10">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a1715] p-6 text-white shadow-[0_24px_90px_rgba(4,15,13,0.18)] md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div>
          <p className="relative text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Creator workspace / Katalog</p>
          <h1 className="mt-2 text-3xl font-semibold">Yayınlar</h1>
          <p className="relative mt-2 max-w-xl text-sm leading-6 text-white/55">Katalogunu hazırla, doğrula ve dağıtım sürecini tek bir akışta takip et.</p>
        </div>
        <Button className="relative mt-5 md:absolute md:right-8 md:top-8">
          <Link href="/releases/new">Yeni yayın</Link>
        </Button>
      </div>

      <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
        <div className="grid gap-3 border-b border-line px-5 py-4 text-xs font-semibold uppercase text-muted md:grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_0.8fr]">
          <span>Yayın</span>
          <span>Tür</span>
          <span>Durum</span>
          <span>UPC</span>
          <span>Güncelleme</span>
        </div>
        <div className="divide-y divide-line">
          {releases.map((release) => (
            <Link className="grid gap-3 px-5 py-4 text-sm hover:bg-white md:grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_0.8fr]" href={`/releases/${release.id}`} key={release.id}>
              <div>
                <p className="font-semibold">{release.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {release.artists.map((artist) => artist.artist.name).join(", ") || "Sanatçı seçilmedi"}
                </p>
              </div>
              <span>{releaseTypeLabels[release.type]}</span>
              <ReleaseStatusBadge status={release.status} />
              <span>{release.upc ?? "Sağlayıcı atayabilir"}</span>
              <span>{release.updatedAt.toLocaleDateString("tr-TR")}</span>
            </Link>
          ))}
          {releases.length === 0 ? (
            <div className="px-5 py-10 text-sm text-muted">
              Bu organizasyonda henüz yayın oluşturulmadı.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
