import { AdminShell } from "@/features/admin/components/admin-shell";
import { DomainManager } from "@/features/platform/components/domain-manager";

export default function SiteBuilderDomainsPage() {
  return <AdminShell title="Özel alan adları" description="Alan adı yalnızca DNS TXT sahiplik doğrulamasından sonra aktif edilebilir; başarısız doğrulama sahte başarıya çevrilmez."><DomainManager /></AdminShell>;
}
