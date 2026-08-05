import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistService } from "@/features/artist/server/services/artist.service";
import { SmartLinkForm } from "@/features/growth/components/smart-link-form";

export default async function NewSmartLinkPage() {
  const { organization } = await authSessionService.getDashboardContext();
  const artists = await artistService.listByOrganizationId(organization.organization.id);

  return (
    <main className="page-shell">
      <section className="panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Smart Link</p>
        <h1 className="mt-3 text-3xl font-semibold">Yeni Smart Link</h1>
        <p className="mt-3 text-sm text-muted">Spotify, Apple Music, sosyal medya ve özel bağlantılarınızı tek bir ücretsiz Radarune sayfasında yayınlayın.</p>
      </section>
      {artists.length > 0 ? <SmartLinkForm artists={artists.map((artist) => ({ id: artist.id, name: artist.name, profileImageUrl: artist.profileImageUrl }))} /> : <section className="panel p-6"><p className="font-semibold">Önce bir sanatçı profili oluşturun.</p></section>}
    </main>
  );
}
