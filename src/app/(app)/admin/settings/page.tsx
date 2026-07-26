import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { adminSystemService } from "@/features/admin/server/services/admin-system.service";

export default async function AdminSettingsPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
  const settings = await adminSystemService.listSettings(actor);

  return (
    <AdminShell title="Platform ayarları" description="Genel, yayın, distribution, dosya yükleme, e-posta, güvenlik ve bakım ayarları tip güvenli key sistemiyle yönetilir.">
      <section className="panel p-6">
        <SimpleTable
          columns={["Ayar", "Değer", "Son güncelleme"]}
          rows={settings.map((setting) => [
            setting.key,
            typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value),
            setting.updatedAt?.toLocaleString("tr-TR") ?? "Varsayılan",
          ])}
        />
      </section>
    </AdminShell>
  );
}
