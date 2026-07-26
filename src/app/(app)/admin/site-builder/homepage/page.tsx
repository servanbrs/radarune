import { AdminShell } from "@/features/admin/components/admin-shell";
import { HomepageEditor } from "@/features/platform/components/homepage-editor";

export default function SiteBuilderHomepagePage() {
  return <AdminShell title="Ana sayfa düzenleyici" description="Bölümleri sıralayın, taslak olarak kaydedin ve yayınlamadan önce doğrulayın."><HomepageEditor /></AdminShell>;
}
