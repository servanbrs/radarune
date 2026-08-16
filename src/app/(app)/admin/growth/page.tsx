import Link from "next/link";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { GrowthAiPanel } from "@/features/growth-engine/components/growth-ai-panel";
import { UtmPlatformComparison } from "@/features/growth-engine/components/utm-platform-comparison";

export default function AdminGrowthPage() {
  return <AdminShell title="AI büyüme merkezi" description="Radarune’a gerçek kullanıcı kazandırmak için veriye dayalı, onaylanabilir büyüme görevleri üretin."><div className="grid gap-6"><div className="flex justify-end"><Link href="/admin/growth/weekly-picks" className="inline-flex items-center rounded-xl border border-[#d6a85f]/40 bg-[#d6a85f]/10 px-4 py-2.5 text-sm font-semibold text-[#f1c77f] transition hover:bg-[#d6a85f]/20">Haftalık paylaşım kartını oluştur</Link></div><UtmPlatformComparison /><GrowthAiPanel /></div></AdminShell>;
}
