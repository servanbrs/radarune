import { AdminShell } from "@/features/admin/components/admin-shell";
import { ThemeEditor } from "@/features/platform/components/theme-editor";

export default function SiteBuilderThemePage() {
  return <AdminShell title="Tema ve renk yönetimi" description="Tema taslağı kaydedilir; yayınlama yeni bir sürüm ve audit kaydı oluşturur."><ThemeEditor /></AdminShell>;
}
