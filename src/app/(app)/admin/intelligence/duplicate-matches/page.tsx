import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { getAdminIntelligenceActor } from "@/features/intelligence/server/admin-intelligence-context";
import { adminIntelligenceService } from "@/features/intelligence/server/services/admin-intelligence.service";

export default async function AdminIntelligenceDuplicateMatchesPage() {
  const actor = await getAdminIntelligenceActor();
  const matches = await adminIntelligenceService.listDuplicateMatches(actor);

  return (
    <AdminShell title="Duplicate audio inceleme" description="Exact hash tabanlı duplicate eşleşmeleri ve cross-tenant manuel inceleme kuyruğu.">
      <section className="panel p-6">
        <SimpleTable
          columns={["Yayın", "Track", "Durum", "Cross tenant", "Eşleşen organizasyon", "Tarih"]}
          rows={matches.map((match) => [
            match.release.title,
            match.track.title,
            match.status,
            match.crossTenant ? "Evet" : "Hayır",
            match.matchedOrganization.name,
            match.createdAt.toLocaleString("tr-TR"),
          ])}
        />
      </section>
    </AdminShell>
  );
}
