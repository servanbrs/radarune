import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistService } from "@/features/artist/server/services/artist.service";
import { SmartLinkForm } from "@/features/growth/components/smart-link-form";

export default async function AdminNewSmartLinkPage() {
  const { organization } = await authSessionService.getDashboardContext();
  const artists = await artistService.listByOrganizationId(organization.organization.id);
  return <AdminShell title="Yeni Smart Link" description="Sanatçı veya organizasyonunuz için platform, sosyal ve SEO bağlantılarını yayınlayın.">{artists.length > 0 ? <SmartLinkForm artists={artists.map((artist) => ({ id: artist.id, name: artist.name }))} redirectTo="/admin/smart-links" /> : <div className="panel p-8">Önce bir sanatçı profili oluşturun.</div>}</AdminShell>;
}
