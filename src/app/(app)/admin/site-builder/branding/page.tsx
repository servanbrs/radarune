import { AdminShell } from "@/features/admin/components/admin-shell";
import { BrandingEditor } from "@/features/platform/components/branding-editor";

export default function SiteBuilderBrandingPage() {
  return <AdminShell title="Marka ayarları" description="Logo, favicon, destek e-postası ve SEO varsayılanları güvenli URL ve e-posta doğrulamasıyla güncellenir."><BrandingEditor /></AdminShell>;
}
