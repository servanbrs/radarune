import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { StatusBadge } from "@/features/admin/components/status-badges";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { adminSystemService } from "@/features/admin/server/services/admin-system.service";

export default async function AdminSystemLogsPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
  const logs = await adminSystemService.listSystemLogs(actor, { page: 1, pageSize: 100 });

  return (
    <AdminShell title="System logs" description="Uygulama, API, webhook, validation, worker ve provider bağlantı hataları. Production ortamında stack trace gösterilmez.">
      <section className="panel p-6">
        <SimpleTable
          columns={["Seviye", "Kaynak", "Mesaj", "Varlık", "Tarih"]}
          rows={logs.items.map((log) => [
            <StatusBadge value={log.level} key={`${log.id}-level`} />,
            log.source,
            log.message,
            log.entityType ? `${log.entityType} / ${log.entityId ?? ""}` : "Yok",
            log.createdAt.toLocaleString("tr-TR"),
          ])}
        />
      </section>
    </AdminShell>
  );
}
