import Link from "next/link";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { StatusBadge } from "@/features/admin/components/status-badges";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { artistApplicationService } from "@/features/admin/server/services/artist-application.service";

export default async function AdminApplicationsPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
  const applications = await artistApplicationService.listApplications(actor, { page: 1, pageSize: 50 });

  return (
    <AdminShell title="Sanatçı başvuruları" description="Başvurular incelemeye alınır, transaction içinde onaylanır, reddedilir veya revizyona gönderilir.">
      <section className="panel p-6">
        <SimpleTable
          columns={["Sahne adı", "Başvuran", "Durum", "Sanatçı", "Tarih"]}
          rows={applications.items.map((item) => [
            <Link className="font-semibold hover:underline" href={`/admin/applications/${item.id}`} key={item.id}>{item.stageName}</Link>,
            `${item.user.name} · ${item.user.email}`,
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            item.artist?.name ?? "Henüz ilişkilendirilmedi",
            item.createdAt.toLocaleDateString("tr-TR"),
          ])}
        />
      </section>
    </AdminShell>
  );
}
