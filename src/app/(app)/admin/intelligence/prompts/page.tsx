import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { getAdminIntelligenceActor } from "@/features/intelligence/server/admin-intelligence-context";
import { adminIntelligenceService } from "@/features/intelligence/server/services/admin-intelligence.service";

export default async function AdminIntelligencePromptsPage() {
  const actor = await getAdminIntelligenceActor();
  const templates = await adminIntelligenceService.listPromptTemplates(actor);

  return (
    <AdminShell title="Prompt yönetimi" description="AI prompt şablonları ve versiyonları. Aktif provider yapılandırılmadan üretim sonucu oluşturulmaz.">
      <section className="panel p-6">
        <SimpleTable
          columns={["Anahtar", "Ad", "Aktif versiyon", "Versiyon sayısı", "Güncelleme"]}
          rows={templates.map((template) => [
            template.key,
            template.name,
            template.activeVersionId ?? "Seçilmedi",
            template.versions.length,
            template.updatedAt.toLocaleString("tr-TR"),
          ])}
        />
      </section>
    </AdminShell>
  );
}
