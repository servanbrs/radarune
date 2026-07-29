import { AdminShell } from "@/features/admin/components/admin-shell";
import { ImportReviewTable } from "@/features/integrations/components/import-review-table";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { importSourceService } from "@/features/integrations/server/services/import-source.service";

export default async function ImportReviewPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const items = await importSourceService.listReviewItems(actor);
  return (
    <AdminShell title="Import inceleme kuyruğu" description="Duplicate ve kaynak güvenliği sinyalleriyle birlikte moderasyon bekleyen içerikleri inceleyin.">
      <ImportReviewTable initialItems={items} />
    </AdminShell>
  );
}
