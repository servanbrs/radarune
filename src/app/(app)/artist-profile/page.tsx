import Link from "next/link";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistService } from "@/features/artist/server/services/artist.service";

export default async function ArtistProfilePage() {
  const { organization } = await authSessionService.getDashboardContext();
  const artists = await artistService.listByOrganizationId(organization.organization.id);
  return (
    <main className="page-shell">
      <section className="panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Artist profile</p>
        <h1 className="mt-3 text-3xl font-semibold">Public sanatçı profilleri</h1>
      </section>
      <section className="grid gap-4">
        {artists.map((artist) => (
          <Link className="panel block p-5" href={`/artist/${artist.slug}`} key={artist.id}>
            <h2 className="text-lg font-semibold">{artist.name}</h2>
            <p className="mt-1 text-sm text-muted">radarune.com/artist/{artist.slug}</p>
            <p className="mt-3 text-xs font-semibold text-accent">Public profili aç · Discover’da paylaş</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
