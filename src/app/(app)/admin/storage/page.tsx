import { AdminShell } from "@/features/admin/components/admin-shell";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { AdminStorageDashboard } from "@/features/admin/storage/components/admin-storage-dashboard";
import { CreateLocalStorageForm } from "@/features/admin/storage/components/create-local-storage-form";
import { adminStorageService } from "@/features/admin/storage/server/services/admin-storage.service";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";

export default async function AdminStoragePage() {
  const { organization, user } =
    await authSessionService.getDashboardContext();

  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  const data =
    await adminStorageService.getDashboard(actor);

  return (
    <AdminShell
      description="Ses dosyaları, kapak görselleri ve diğer medya yüklemeleri için kullanılan storage providerlarını yönetin."
      title="Dosya Depolama"
    >
      <div className="grid gap-5">
        <AdminStorageDashboard data={data} />

        <CreateLocalStorageForm />
      </div>
    </AdminShell>
  );
}
