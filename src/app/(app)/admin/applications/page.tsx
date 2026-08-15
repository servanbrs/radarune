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
  // The moderation screen is the archive as well as the active queue. Keep
  // historical applications visible instead of silently truncating the list
  // at the first 50 records.
  const applications = await artistApplicationService.listApplications(actor, { page: 1, pageSize: 5000 });

  return (
    <AdminShell title="Sanatçı başvuruları" description="Başvurular incelemeye alınır, transaction içinde onaylanır, reddedilir veya revizyona gönderilir.">
      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="panel p-4"><p className="text-xs uppercase tracking-[0.14em] text-muted">Toplam başvuru</p><p className="mt-2 text-2xl font-bold">{applications.total}</p></div>
        <div className="panel p-4"><p className="text-xs uppercase tracking-[0.14em] text-muted">Bekleyen / incelemede</p><p className="mt-2 text-2xl font-bold">{applications.items.filter((item) => item.status === "PENDING" || item.status === "UNDER_REVIEW" || item.status === "REVISION_REQUESTED").length}</p></div>
        <div className="panel p-4"><p className="text-xs uppercase tracking-[0.14em] text-muted">Sonuçlanmış / arşiv</p><p className="mt-2 text-2xl font-bold">{applications.items.filter((item) => item.status === "APPROVED" || item.status === "REJECTED").length}</p></div>
      </section>
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
