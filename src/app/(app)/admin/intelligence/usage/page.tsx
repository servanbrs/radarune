import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminStatCard } from "@/features/admin/components/admin-stat-card";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { getAdminIntelligenceActor } from "@/features/intelligence/server/admin-intelligence-context";
import { adminIntelligenceService } from "@/features/intelligence/server/services/admin-intelligence.service";

export default async function AdminIntelligenceUsagePage() {
  const actor = await getAdminIntelligenceActor();
  const usage = await adminIntelligenceService.getUsage(actor);

  return (
    <AdminShell title="AI kullanım raporu" description="Token/iş kullanım kayıtları ve release readiness geçmişi. Finansal/provider maliyeti minor unit olarak saklanır.">
      <section className="grid gap-4 md:grid-cols-3">
        <AdminStatCard label="Kullanım tipi" value={usage.usageByType.length} />
        <AdminStatCard label="Job durumu" value={usage.jobStatus.length} />
        <AdminStatCard label="Bekleyen öneri" value={usage.pendingSuggestions} tone={usage.pendingSuggestions > 0 ? "warn" : "neutral"} />
      </section>
      <section className="panel p-6">
        <h2 className="text-lg font-semibold">Kullanım</h2>
        <div className="mt-4">
          <SimpleTable
            columns={["Tip", "Kayıt", "Birim", "Maliyet"]}
            rows={usage.usageByType.map((item) => [
              item.usageType,
              item._count._all,
              item._sum.unitCount ?? 0,
              item._sum.costMinor?.toString() ?? "0",
            ])}
          />
        </div>
      </section>
      <section className="panel p-6">
        <h2 className="text-lg font-semibold">Son readiness skorları</h2>
        <div className="mt-4">
          <SimpleTable
            columns={["Yayın", "Skor", "Blocking", "Warning", "Tarih"]}
            rows={usage.latestReadiness.map((score) => [
              score.release.title,
              score.score,
              score.blockingCount,
              score.warningCount,
              score.createdAt.toLocaleString("tr-TR"),
            ])}
          />
        </div>
      </section>
    </AdminShell>
  );
}
