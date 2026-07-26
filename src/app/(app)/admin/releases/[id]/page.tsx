import { notFound } from "next/navigation";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { StatusBadge } from "@/features/admin/components/status-badges";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { releaseModerationService } from "@/features/admin/server/services/release-moderation.service";

export default async function AdminReleaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
  const release = await releaseModerationService.getRelease(actor, id);
  if (!release) {
    notFound();
  }

  return (
    <AdminShell title={release.title} description="Yayın metadata, parça listesi, validation issue, status history ve dağıtım hazırlığı.">
      <section className="grid gap-6 xl:grid-cols-2">
        <article className="panel p-6">
          <h2 className="text-lg font-semibold">Metadata</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p>Durum: <StatusBadge value={release.status} /></p>
            <p>Tür: {release.type}</p>
            <p>UPC: {release.upc ?? "Yok"}</p>
            <p>Provider: {release.distributionProvider ?? "Seçilmedi"}</p>
            <p>Label: {release.label?.name ?? "Yok"}</p>
            <p>Oluşturan: {release.createdByUser.name} · {release.createdByUser.email}</p>
          </div>
        </article>
        <article className="panel p-6">
          <h2 className="text-lg font-semibold">Validation issue</h2>
          <div className="mt-4 space-y-3">
            {release.validationIssues.map((issue) => (
              <div className="rounded-2xl border border-line bg-white/70 p-4 text-sm" key={issue.id}>
                <p className="font-semibold">{issue.severity} · {issue.fieldPath}</p>
                <p className="mt-1 text-muted">{issue.message}</p>
              </div>
            ))}
            {release.validationIssues.length === 0 ? <p className="text-sm text-muted">Açık validation issue yok.</p> : null}
          </div>
        </article>
      </section>
      <section className="panel p-6">
        <h2 className="text-lg font-semibold">Parçalar</h2>
        <div className="mt-4 grid gap-3">
          {release.tracks.map((track) => (
            <div className="rounded-2xl border border-line bg-white/70 p-4 text-sm" key={track.id}>
              <p className="font-semibold">{track.discNumber}.{track.trackNumber} · {track.title}</p>
              <p className="mt-1 text-muted">ISRC: {track.isrc ?? "Yok"} · Ses: {track.audioUploadId ? "Yüklü" : "Eksik"}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="panel p-6">
        <h2 className="text-lg font-semibold">Status history</h2>
        <div className="mt-4 space-y-3">
          {release.statusHistory.map((history) => (
            <div className="rounded-2xl border border-line bg-white/70 p-4 text-sm" key={history.id}>
              <p className="font-semibold">{history.previousStatus ?? "İlk durum"} → {history.status}</p>
              <p className="mt-1 text-muted">{history.reason ?? "Açıklama yok"} · {history.createdAt.toLocaleString("tr-TR")}</p>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
