import { AdminShell } from "@/features/admin/components/admin-shell";
import { DiscoverEditor } from "@/features/platform/components/discover-editor";

export default function SiteBuilderDiscoverPage() {
  return <AdminShell title="Discover ayarları" description="Discover skor ağırlıkları güvenli aralıkta normalize edilir; sponsorlu içerik public kartta açıkça etiketlenmelidir."><DiscoverEditor /></AdminShell>;
}
