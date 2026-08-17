import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import Link from "next/link";
import { CreateArtistForm } from "@/features/artist/components/create-artist-form";
import { artistService } from "@/features/artist/server/services/artist.service";
import { rbacService } from "@/features/authorization/server/rbac";

export default async function ArtistsPage() {
  const { organization } = await authSessionService.getDashboardContext();
  rbacService.redirectIfMissingPermission(organization.role, "artist:view");

  const artists = await artistService.listByOrganizationId(organization.organization.id);
  const canCreate = rbacService.hasPermission(organization.role, "artist:create");

  return (
    <main className="page-shell">
      <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="panel p-6 md:p-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Sanatçı kayıtları</p>
            <h1 className="text-3xl font-semibold">Sanatçılar</h1>
            <p className="text-sm leading-7 text-muted">
              Aktif çalışma alanınızdaki sanatçı profillerini oluşturun ve yönetin.
            </p>
          </div>
          {canCreate ? (
            <div className="mt-8">
              <CreateArtistForm />
            </div>
          ) : (
            <p className="mt-8 rounded-2xl border bg-white/60 px-4 py-3 text-sm text-muted">
              Mevcut rolünüz sanatçıları görüntüleyebilir ancak yeni sanatçı oluşturamaz.
            </p>
          )}
        </section>

        <section className="panel p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Aktif kadro</p>
              <h2 className="mt-2 text-2xl font-semibold">{artists.length} sanatçı</h2>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {artists.length === 0 ? (
              <p className="rounded-2xl border bg-white/60 px-4 py-6 text-sm text-muted">
                Bu çalışma alanında henüz sanatçı yok.
              </p>
            ) : (
              artists.map((artist) => (
                <Link className="group block rounded-[1.5rem] border bg-white/70 p-5 transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" href={`/artist/${artist.slug}`} key={artist.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{artist.name}</h3>
                      <p className="mt-1 text-sm text-muted">Profil: /{artist.slug}</p>
                    </div>
                    <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {artist.type}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    Arama adı: {artist.sortName ?? "Belirlenmedi"}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Label bağlantısı: {artist._count.labelLinks}
                  </p>
                  <span className="mt-4 inline-flex items-center text-sm font-semibold text-accent">Herkese açık profili görüntüle →</span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
