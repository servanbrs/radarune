import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistService } from "@/features/artist/server/services/artist.service";

export default async function NewSmartLinkPage() {
  const { organization } = await authSessionService.getDashboardContext();
  const artists = await artistService.listByOrganizationId(organization.organization.id);

  return (
    <main className="page-shell">
      <section className="panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Smart Link</p>
        <h1 className="mt-3 text-3xl font-semibold">Yeni Smart Link</h1>
        <p className="mt-3 text-sm text-muted">API: <code>/api/growth/smart-links</code>. Sanatçı seçimi ve platform URL’leri HTTPS/Zod ile doğrulanır.</p>
      </section>
      <section className="panel p-6">
        <h2 className="text-lg font-semibold">Kullanılabilir sanatçılar</h2>
        <div className="mt-4 grid gap-3">
          {artists.map((artist) => (
            <div className="rounded-2xl border border-line bg-white/70 p-4" key={artist.id}>
              <p className="font-semibold">{artist.name}</p>
              <p className="mt-1 text-xs text-muted">artistId: {artist.id}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
