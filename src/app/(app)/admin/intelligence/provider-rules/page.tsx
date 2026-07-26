import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { getAdminIntelligenceActor } from "@/features/intelligence/server/admin-intelligence-context";
import { adminIntelligenceService } from "@/features/intelligence/server/services/admin-intelligence.service";

export default async function AdminIntelligenceProviderRulesPage() {
  const actor = await getAdminIntelligenceActor();
  const profiles = await adminIntelligenceService.listRuleProfiles(actor);

  return (
    <AdminShell title="Provider kural profilleri" description="Mağaza/provider uyumluluğu için tip güvenli kural profilleri ve aktif kurallar.">
      <section className="panel p-6">
        <SimpleTable
          columns={["Profil", "Kod", "Versiyon", "Durum", "Aktif kural"]}
          rows={profiles.map((profile) => [
            profile.name,
            profile.code,
            profile.version,
            profile.active ? "Aktif" : "Pasif",
            profile.rules.filter((rule) => rule.active).length,
          ])}
        />
      </section>
    </AdminShell>
  );
}
