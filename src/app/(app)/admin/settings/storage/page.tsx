import { AdminShell } from "@/features/admin/components/admin-shell";
import { assertAdminPermission, toAdminActor } from "@/features/admin/server/admin-context";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { storageService } from "@/features/storage/server/services/storage.service";

export default async function StorageSettingsPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  assertAdminPermission(actor, "storage.view");
  const status = storageService.getStatus();
  return (
    <AdminShell title="Storage ayarları" description="Dosyalar MySQL içinde tutulmaz; aktif storage adapter üzerinden güvenli object key ile saklanır.">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Aktif provider</p>
        <p className="mt-2 text-2xl font-semibold">{status.provider}</p>
        {!status.configuration.configured ? <p className="mt-4 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">Yapılandırma gerekli: {status.configuration.missingFields.join(", ")}</p> : null}
        {status.provider === "LOCAL" ? <p className="mt-4 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">Local storage aktif. Production ortamında açıkça etkinleştirilmesi gerekir; harici provider’a geçmeden önce migration planı oluşturun.</p> : null}
      </section>
    </AdminShell>
  );
}
