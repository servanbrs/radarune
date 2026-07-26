import { notFound } from "next/navigation";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { StatusBadge } from "@/features/admin/components/status-badges";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { artistApplicationService } from "@/features/admin/server/services/artist-application.service";

export default async function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
  const application = await artistApplicationService.getApplication(actor, id);
  if (!application) {
    notFound();
  }

  return (
    <AdminShell title={application.stageName} description="Başvuru detayları, sosyal linkler, belge referansı, notlar ve işlem geçmişi.">
      <section className="grid gap-6 xl:grid-cols-2">
        <article className="panel p-6">
          <h2 className="text-lg font-semibold">Başvuru bilgileri</h2>
          <div className="mt-4 space-y-3 text-sm leading-7">
            <p>Durum: <StatusBadge value={application.status} /></p>
            <p>Kullanıcı: {application.user.name} · {application.user.email}</p>
            <p>Yasal ad / şirket: {application.legalName}</p>
            <p>Spotify: {application.spotifyArtistUrl ?? "Yok"}</p>
            <p>Apple Music: {application.appleMusicArtistUrl ?? "Yok"}</p>
            <p>YouTube: {application.youtubeChannelUrl ?? "Yok"}</p>
            <p>Belge referansı: {application.documentReference ?? "Yok"}</p>
          </div>
        </article>
        <article className="panel p-6">
          <h2 className="text-lg font-semibold">Biyografi</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted">{application.biography}</p>
        </article>
      </section>
      <section className="panel p-6">
        <h2 className="text-lg font-semibold">İşlem geçmişi</h2>
        <div className="mt-4 space-y-3">
          {application.statusHistory.map((history) => (
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
