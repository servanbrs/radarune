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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted">Release Management</p>
          <h1 className="mt-2 text-3xl font-semibold">Yayınlar</h1>
        </div>
        <Button>
          <Link href="/releases/new">Yeni yayın</Link>
        </Button>
      </div>

      <section className="overflow-hidden rounded-3xl border border-line bg-surface">
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
