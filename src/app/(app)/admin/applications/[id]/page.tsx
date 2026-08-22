import { notFound } from "next/navigation";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { StatusBadge } from "@/features/admin/components/status-badges";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { artistApplicationService } from "@/features/admin/server/services/artist-application.service";
import { ArtistApplicationReviewActions } from "@/features/admin/components/artist-application-review-actions";

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

  const socialLinks = application.socialLinks && typeof application.socialLinks === "object" && !Array.isArray(application.socialLinks)
    ? application.socialLinks as Record<string, unknown>
    : {};
  const verificationLinks = [
    application.spotifyArtistUrl,
    application.appleMusicArtistUrl,
    application.youtubeChannelUrl,
    application.documentReference,
    typeof socialLinks.deezerArtistUrl === "string" ? socialLinks.deezerArtistUrl : null,
    typeof socialLinks.itunesArtistUrl === "string" ? socialLinks.itunesArtistUrl : null,
  ].filter((value): value is string => Boolean(value?.trim()));

  return (
    <AdminShell title={application.stageName} description="Başvuru detayları, sosyal linkler, belge referansı, notlar ve işlem geçmişi.">
      <section className="grid gap-6 xl:grid-cols-2">
        <article className="panel p-6">
          <h2 className="text-lg font-semibold">Başvuru bilgileri</h2>
          <div className="mt-4 space-y-3 text-sm leading-7">
            <p>Durum: <StatusBadge value={application.status} /></p>
            <p>Kullanıcı: {application.user.name} · {application.user.email}</p>
            <p>Yasal ad / şirket: {application.legalName}</p>
            <p>Spotify: {application.spotifyArtistUrl ? <a className="break-all text-accent underline" href={application.spotifyArtistUrl} rel="noreferrer" target="_blank">{application.spotifyArtistUrl}</a> : "Yok"}</p>
            <p>Apple Music: {application.appleMusicArtistUrl ? <a className="break-all text-accent underline" href={application.appleMusicArtistUrl} rel="noreferrer" target="_blank">{application.appleMusicArtistUrl}</a> : "Yok"}</p>
            <p>YouTube: {application.youtubeChannelUrl ? <a className="break-all text-accent underline" href={application.youtubeChannelUrl} rel="noreferrer" target="_blank">{application.youtubeChannelUrl}</a> : "Yok"}</p>
            <p>Deezer: {typeof socialLinks.deezerArtistUrl === "string" ? <a className="break-all text-accent underline" href={socialLinks.deezerArtistUrl} rel="noreferrer" target="_blank">{socialLinks.deezerArtistUrl}</a> : "Yok"}</p>
            <p>iTunes: {typeof socialLinks.itunesArtistUrl === "string" ? <a className="break-all text-accent underline" href={socialLinks.itunesArtistUrl} rel="noreferrer" target="_blank">{socialLinks.itunesArtistUrl}</a> : "Yok"}</p>
            <p>Belge referansı: {application.documentReference ? <a className="break-all text-accent underline" href={application.documentReference} rel="noreferrer" target="_blank">{application.documentReference}</a> : "Yok"}</p>
            <p className="rounded-xl border border-amber-300/40 bg-amber-50 p-3 text-amber-950">Doğrulama: {verificationLinks.length > 0 ? "Kanıt mevcut — bağlantıyı manuel doğrulayın." : "Kanıt yok — onaylanamaz."}</p>
          </div>
        </article>
        <article className="panel p-6">
          <h2 className="text-lg font-semibold">Biyografi</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted">{application.biography}</p>
        </article>
      </section>
      <ArtistApplicationReviewActions applicationId={application.id} status={application.status} />
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
