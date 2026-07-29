import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { getAdminIntelligenceActor } from "@/features/intelligence/server/admin-intelligence-context";
import { adminIntelligenceService } from "@/features/intelligence/server/services/admin-intelligence.service";
import { aiProviderRegistry } from "@/features/intelligence/server/adapters/ai-provider-registry";

export default async function AdminIntelligenceProvidersPage() {
  const actor = await getAdminIntelligenceActor();
  const providers = await adminIntelligenceService.listProviders(actor);
  const openAiConfiguration = await aiProviderRegistry.get("OPENAI").validateConfiguration();

  return (
    <AdminShell title="AI provider yönetimi" description="Provider sağlık durumu, yetenekleri ve credential varlığı maskeli olarak izlenir. Secret değerleri istemciye gönderilmez.">
      <section className="panel p-6">
        <div className="mb-6 rounded-2xl border border-line bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Harici AI bağlantısı</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">OpenAI yayın yardımcısı</h2>
              <p className="mt-1 text-sm text-muted">OPENAI_API_KEY yalnızca sunucuda tutulur; yayın skoru deterministik kurallarla hesaplanır, AI yalnızca öneri üretir.</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${openAiConfiguration.success ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"}`}>
              {openAiConfiguration.success ? "Yapılandırıldı" : "Anahtar bekleniyor"}
            </span>
          </div>
          {!openAiConfiguration.success ? <p className="mt-3 text-xs text-muted">Sunucu .env dosyasına OPENAI_API_KEY ekleyip uygulamayı yeniden başlatın.</p> : null}
        </div>
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
