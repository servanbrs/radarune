import { AdminShell } from "@/features/admin/components/admin-shell";
import { BrandingEditor } from "@/features/platform/components/branding-editor";

export default function SiteBuilderBrandingPage() {
  return <AdminShell title="Marka ayarları" description="Logo ve favicon dosyalarını yükleyin; ideal ölçüler ve formatlar form alanlarında belirtilir."><BrandingEditor /></AdminShell>;
}
