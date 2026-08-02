import { AdminAiProviderConsole } from "@/features/ai-provider/components/admin-ai-provider-console";
import { AdminShell } from "@/features/admin/components/admin-shell";

export default function AdminIntelligenceProvidersPage() {
  return <AdminShell title="AI provider yönetimi" description="Yapay zekâ sağlayıcılarını, aktif modeli ve AI Chat bağlantısını tek çalışma alanında yönetin."><AdminAiProviderConsole /></AdminShell>;
}
