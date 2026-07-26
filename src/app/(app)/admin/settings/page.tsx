import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminSettingsForm } from "@/features/admin/components/admin-settings-form";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { adminSystemService } from "@/features/admin/server/services/admin-system.service";

export default async function AdminSettingsPage() {
  const { organization, user } =
    await authSessionService.getDashboardContext();

  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  const settings =
    await adminSystemService.listSettings(actor);

  return (
    <AdminShell
      title="Site ayarları"
      description="Radarune marka, üyelik, dağıtım, dosya yükleme ve bakım ayarlarını yönetin."
    >
      <AdminSettingsForm settings={settings} />
    </AdminShell>
  );
}