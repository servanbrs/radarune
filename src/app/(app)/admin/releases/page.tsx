/* eslint-disable @next/next/no-img-element -- Artwork URLs come from private storage and are not known at build time. */
import Link from "next/link";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { StatusBadge } from "@/features/admin/components/status-badges";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { releaseModerationService } from "@/features/admin/server/services/release-moderation.service";

export default async function AdminReleasesPage({ searchParams }: { searchParams: Promise<{ q?: string; durum?: string }> }) {
  const query = await searchParams;
  const allowedStatuses = ["DRAFT", "PENDING_REVIEW", "REVISION_REQUESTED", "APPROVED", "REJECTED", "QUEUED", "PROCESSING", "DISTRIBUTED", "LIVE"];
  const status = query.durum && allowedStatuses.includes(query.durum) ? query.durum : undefined;
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
  const releases = await releaseModerationService.listReleases(actor, { page: 1, pageSize: 100, ...(query.q ? { search: query.q } : {}), ...(status ? { status: status as never } : {}) });
  const counts = releases.items.reduce<Record<string, number>>((result, release) => {
    result[release.status] = (result[release.status] ?? 0) + 1;
    return result;
  }, {});

  return (
    <AdminShell title="Yayın moderasyonu" description="Metadata, track, validation, distribution ve status history bilgileriyle yayın inceleme merkezi.">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[["Bekleyen", "PENDING_REVIEW"], ["Revizyon", "REVISION_REQUESTED"], ["Onaylı", "APPROVED"], ["Kuyrukta", "QUEUED"], ["Dağıtıldı", "DISTRIBUTED"], ["Yayında", "LIVE"]].map(([label, status]) => (
          <Link key={status} href={`/admin/releases?durum=${status}`} className="panel p-4 transition hover:border-accent">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{counts[status as string] ?? 0}</p>
          </Link>
        ))}
      </section>
      <section className="panel p-5">
        <form className="flex flex-wrap gap-3" method="get">
          <input className="min-w-[240px] flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-sm" name="q" defaultValue={query.q} placeholder="Yayın, UPC veya sanatçı ara" />
          <select className="rounded-xl border border-line bg-surface px-4 py-3 text-sm" name="durum" defaultValue={query.durum ?? ""}>
            <option value="">Tüm durumlar</option><option value="DRAFT">Taslak</option><option value="PENDING_REVIEW">Kontrolde</option><option value="REVISION_REQUESTED">Düzeltme bekliyor</option><option value="APPROVED">Onaylandı</option><option value="QUEUED">Dağıtım kuyruğunda</option><option value="PROCESSING">Dağıtım işleniyor</option><option value="DISTRIBUTED">Dağıtıldı</option><option value="LIVE">Yayında</option><option value="REJECTED">Reddedildi</option>
          </select>
          <button className="rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background" type="submit">Filtrele</button>
        </form>
      </section>
      <section className="panel p-6">
        <SimpleTable
          columns={["Kapak", "Yayın", "Sanatçı", "Tür", "UPC", "Durum", "Parça", "Güncelleme"]}
          rows={releases.items.map((release) => [
            release.artworkUploadId ? <img key={`${release.id}-artwork`} alt="Kapak" className="h-12 w-12 rounded-lg object-cover" src={`/api/storage/private/${release.artworkUploadId}`} /> : <span key={`${release.id}-no-artwork`} className="text-xs text-muted">Kapak yok</span>,
            <span className="flex flex-col gap-1" key={release.id}><Link className="font-semibold hover:underline" href={`/admin/releases/${release.id}`}>{release.title}</Link><Link className="text-xs text-accent hover:underline" href={`/releases/${release.id}/edit`}>Yayını düzenle</Link></span>,
            release.artists.map((item) => item.artist.name).join(", ") || "Sanatçı yok",
            release.type,
            release.upc ?? "Sağlayıcı atayabilir",
            <StatusBadge value={release.status} key={`${release.id}-status`} />,
            release.tracks.length,
            release.updatedAt.toLocaleDateString("tr-TR"),
          ])}
        />
      </section>
    </AdminShell>
  );
}
