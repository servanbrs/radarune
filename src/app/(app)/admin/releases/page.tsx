import Link from "next/link";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { StatusBadge } from "@/features/admin/components/status-badges";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { releaseModerationService } from "@/features/admin/server/services/release-moderation.service";

export default async function AdminReleasesPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
  const releases = await releaseModerationService.listReleases(actor, { page: 1, pageSize: 50 });

  return (
    <AdminShell title="Yayın moderasyonu" description="Metadata, track, validation, distribution ve status history bilgileriyle yayın inceleme merkezi.">
      <section className="panel p-6">
        <SimpleTable
          columns={["Yayın", "Sanatçı", "Tür", "UPC", "Durum", "Track", "Güncelleme"]}
          rows={releases.items.map((release) => [
            <Link className="font-semibold hover:underline" href={`/admin/releases/${release.id}`} key={release.id}>{release.title}</Link>,
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
