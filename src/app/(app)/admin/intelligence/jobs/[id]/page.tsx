import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { IntelligenceStatusBadge } from "@/features/intelligence/components/intelligence-status-badge";
import { getAdminIntelligenceActor } from "@/features/intelligence/server/admin-intelligence-context";
import { intelligenceRepository } from "@/features/intelligence/server/repositories/intelligence.repository";
import { rbacService } from "@/features/authorization/server/rbac";

type AdminIntelligenceJobDetailProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminIntelligenceJobDetailPage({ params }: AdminIntelligenceJobDetailProps) {
  const actor = await getAdminIntelligenceActor();
  rbacService.assertEffectivePermission({
    membershipRole: actor.membershipRole,
    systemRole: actor.systemRole,
    permission: "admin.intelligence.view",
  });
  const { id } = await params;
  const job = await intelligenceRepository.getJob(actor.organizationId, id);

  if (!job) {
    notFound();
  }

  return (
    <AdminShell title="AI iş detayı" description="Tekil analiz işinin provider, deneme ve hata durumu.">
      <section className="panel p-6">
        <dl className="grid gap-4 md:grid-cols-2">
          <Detail label="İş tipi" value={job.jobType} />
          <Detail label="Durum" value={<IntelligenceStatusBadge status={job.status} />} />
          <Detail label="Provider" value={job.provider?.displayName ?? "Atanmadı"} />
          <Detail label="Son hata" value={job.lastErrorMessage ?? "Yok"} />
        </dl>
      </section>
      <section className="panel p-6">
        <h2 className="text-lg font-semibold">Denemeler</h2>
        <div className="mt-4">
          <SimpleTable
            columns={["Deneme", "Durum", "Hata", "Süre", "Tarih"]}
            rows={job.attempts.map((attempt) => [
              attempt.attemptNumber,
              <IntelligenceStatusBadge status={attempt.status} key={attempt.id} />,
              attempt.errorMessage ?? "Yok",
              attempt.durationMs ? `${attempt.durationMs} ms` : "Ölçülmedi",
              attempt.startedAt.toLocaleString("tr-TR"),
            ])}
          />
        </div>
      </section>
    </AdminShell>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white/70 p-4">
      <dt className="text-xs uppercase tracking-[0.18em] text-muted">{label}</dt>
      <dd className="mt-2 text-sm font-semibold">{value}</dd>
    </div>
  );
}
