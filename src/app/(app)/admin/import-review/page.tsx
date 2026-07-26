import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { importSourceService } from "@/features/integrations/server/services/import-source.service";

export default async function ImportReviewPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const items = await importSourceService.listReviewItems(actor);
  return (
    <AdminShell title="Import inceleme kuyruğu" description="Duplicate ve kaynak güvenliği sinyalleriyle birlikte moderasyon bekleyen içerikleri inceleyin.">
      <section className="panel p-6">
        <SimpleTable columns={["İçerik", "Kaynak", "Durum", "Eşleşme", "Kaynak güvenliği"]} rows={items.map((item) => [
          <div key={item.id}><p className="font-semibold">{item.title ?? "Başlık yok"}</p><p className="mt-1 text-xs text-muted">{item.artistName ?? "Sanatçı yok"}</p></div>,
          item.source.name,
          item.status,
          item.matchConfidence,
          item.externalMediaSource?.playable && item.externalMediaSource.embeddable ? "Oynatılabilir" : "Public embed yok",
        ])} />
      </section>
    </AdminShell>
  );
}
