import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { adminSystemService } from "@/features/admin/server/services/admin-system.service";

export default async function AdminAuditLogsPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
  const logs = await adminSystemService.listAuditLogs(actor, { page: 1, pageSize: 100 });

  return (
    <AdminShell title="Audit log" description="Kritik admin, release, provider ve finans işlemlerinin değiştirilemez işlem izleri.">
      <section className="panel p-6">
        <SimpleTable
          columns={["İşlem", "Varlık", "Aktör", "Metadata", "Tarih"]}
          rows={logs.items.map((log) => [
            log.action,
            `${log.entityType}${log.entityId ? ` / ${log.entityId}` : ""}`,
            log.actorUser?.name ?? "Sistem",
            JSON.stringify(log.metadata ?? {}),
            log.createdAt.toLocaleString("tr-TR"),
          ])}
        />
      </section>
    </AdminShell>
  );
}
