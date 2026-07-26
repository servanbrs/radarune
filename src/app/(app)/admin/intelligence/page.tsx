import Link from "next/link";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminStatCard } from "@/features/admin/components/admin-stat-card";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { IntelligenceStatusBadge } from "@/features/intelligence/components/intelligence-status-badge";
import { getAdminIntelligenceActor } from "@/features/intelligence/server/admin-intelligence-context";
import { adminIntelligenceService } from "@/features/intelligence/server/services/admin-intelligence.service";

export default async function AdminIntelligencePage() {
  const actor = await getAdminIntelligenceActor();
  const overview = await adminIntelligenceService.getOverview(actor);
  const queuedJobs = overview.usage.jobStatus.find((item) => item.status === "QUEUED")?._count._all ?? 0;
  const failedJobs = overview.usage.jobStatus.find((item) => item.status === "FAILED")?._count._all ?? 0;

  return (
    <AdminShell
      title="AI Intelligence Merkezi"
      description="Metadata doğrulama, kalite kontrol, duplicate detection ve provider uyumluluğu tek merkezden izlenir."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Provider" value={overview.providers.length} />
        <AdminStatCard label="Kuyruktaki iş" value={queuedJobs} tone={queuedJobs > 0 ? "warn" : "neutral"} />
        <AdminStatCard label="Başarısız iş" value={failedJobs} tone={failedJobs > 0 ? "danger" : "good"} />
        <AdminStatCard label="Bekleyen öneri" value={overview.usage.pendingSuggestions} tone={overview.usage.pendingSuggestions > 0 ? "warn" : "neutral"} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { href: "/admin/intelligence/providers", label: "Providerlar" },
          { href: "/admin/intelligence/jobs", label: "Analiz İşleri" },
          { href: "/admin/intelligence/provider-rules", label: "Provider Kuralları" },
          { href: "/admin/intelligence/duplicate-matches", label: "Duplicate İnceleme" },
          { href: "/admin/intelligence/prompts", label: "Prompt Yönetimi" },
          { href: "/admin/intelligence/usage", label: "Kullanım" },
          { href: "/admin/intelligence/settings", label: "Ayarlar" },
        ].map((item) => (
          <Link className="rounded-3xl border border-line bg-white/70 p-5 text-sm font-semibold transition hover:bg-white" href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </section>

      <section className="panel p-6">
        <h2 className="text-lg font-semibold">Son analiz işleri</h2>
        <div className="mt-4">
          <SimpleTable
            columns={["Tip", "Durum", "Provider", "Deneme", "Tarih"]}
            rows={overview.jobs.map((job) => [
              job.jobType,
              <IntelligenceStatusBadge status={job.status} key={job.id} />,
              job.provider?.displayName ?? "Atanmadı",
              job.attemptCount,
              job.createdAt.toLocaleString("tr-TR"),
            ])}
          />
        </div>
      </section>
    </AdminShell>
  );
}
