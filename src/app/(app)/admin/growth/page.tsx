import { AdminShell } from "@/features/admin/components/admin-shell";
import { GrowthAiPanel } from "@/features/growth-engine/components/growth-ai-panel";

export default function AdminGrowthPage() {
  return <AdminShell title="AI büyüme merkezi" description="Radarune’a gerçek kullanıcı kazandırmak için veriye dayalı, onaylanabilir büyüme görevleri üretin."><GrowthAiPanel /></AdminShell>;
}
