import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { getAdminIntelligenceActor } from "@/features/intelligence/server/admin-intelligence-context";
import { adminIntelligenceService } from "@/features/intelligence/server/services/admin-intelligence.service";

export default async function AdminIntelligenceProvidersPage() {
  const actor = await getAdminIntelligenceActor();
  const providers = await adminIntelligenceService.listProviders(actor);

  return (
    <AdminShell title="AI provider yönetimi" description="Provider sağlık durumu, yetenekleri ve credential varlığı maskeli olarak izlenir. Secret değerleri istemciye gönderilmez.">
      <section className="panel p-6">
        <SimpleTable
          columns={["Provider", "Durum", "Öncelik", "Capability", "Credential", "Son kontrol"]}
          rows={providers.map((provider) => [
            provider.displayName,
            provider.active ? "Aktif" : "Pasif",
            provider.priority,
            provider.capabilities.map((capability) => capability.capability).join(", ") || "Tanımsız",
            provider.credentials.map((credential) => `${credential.keyName}: ${credential.maskedValue}`).join(", ") || "Yok",
            provider.lastHealthCheckedAt?.toLocaleString("tr-TR") ?? "Kontrol edilmedi",
          ])}
        />
      </section>
    </AdminShell>
  );
}
