import { AdminShell } from "@/features/admin/components/admin-shell";
import { WeeklyShareCardBuilder } from "@/features/admin/components/weekly-share-card-builder";
import { getAdminActor } from "@/features/admin/server/http/admin-route";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { weeklyShareCardService } from "@/features/admin/server/services/weekly-share-card.service";

export default async function WeeklyPicksPage() {
  const actor = await getAdminActor();
  if (actor.systemRole !== "ADMIN" && actor.systemRole !== "SUPER_ADMIN") {
    throw new Error("Bu alan yalnızca admin onayı için kullanılabilir.");
  }
  assertAdminPermission(actor, "releases:view");
  const dashboard = await weeklyShareCardService.getDashboard(actor);

  return (
    <AdminShell
      title="Haftalık paylaşım kartı"
      description="Haftanın ilk 5 yayınını seçin, paylaşım kartını hazırlayın ve yayınlamadan önce admin onayına gönderin."
    >
      <WeeklyShareCardBuilder candidates={dashboard.candidates} card={dashboard.card} />
    </AdminShell>
  );
}
