import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { IntelligenceStatusBadge } from "@/features/intelligence/components/intelligence-status-badge";
import { getAdminIntelligenceActor } from "@/features/intelligence/server/admin-intelligence-context";
import { adminIntelligenceService } from "@/features/intelligence/server/services/admin-intelligence.service";

export default async function AdminIntelligenceJobsPage() {
  const actor = await getAdminIntelligenceActor();
  const jobs = await adminIntelligenceService.listJobs(actor);

  return (
    <AdminShell title="AI analiz işleri" description="Kuyruk, deneme geçmişi ve provider sonuçları izlenir. Gerçek provider bağlanmadan AI sonucu üretilmez.">
      <section className="panel p-6">
        <SimpleTable
          columns={["ID", "Tip", "Durum", "Provider", "Hata", "Oluşturulma"]}
          rows={jobs.map((job) => [
            job.id,
            job.jobType,
            <IntelligenceStatusBadge status={job.status} key={job.id} />,
            job.provider?.displayName ?? "Atanmadı",
            job.lastErrorMessage ?? "Yok",
            job.createdAt.toLocaleString("tr-TR"),
          ])}
        />
      </section>
    </AdminShell>
  );
}
