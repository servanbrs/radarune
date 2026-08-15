import Link from "next/link";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistService } from "@/features/artist/server/services/artist.service";

export default async function AdminArtistsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { organization, user } = await authSessionService.getDashboardContext();
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const artists = await artistService.listByOrganizationId(
    organization.organization.id,
    search || undefined,
    user.systemRole === "SUPER_ADMIN",
  );

  return (
    <AdminShell title="Sanatçılar" description="Organizasyona bağlı onaylı sanatçı profilleri ve label ilişkileri.">
      <section className="mb-5 panel p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Toplam sanatçı: {artists.length}</p>
          <Link className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground" href="/admin/artists/new">Sanatçı ekle</Link>
        </div>
        <form className="flex flex-col gap-3 sm:flex-row" method="GET">
          <input
            className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-surface-strong px-4 text-sm"
            defaultValue={search}
            name="q"
            placeholder="Sanatçı veya bağlı profil ara..."
          />
          <button
            className="rounded-full border border-line px-5 py-2 text-sm font-semibold"
            type="submit"
          >
            Ara
          </button>
          {search ? (
            <Link
              className="rounded-full border border-line px-5 py-2 text-center text-sm font-semibold"
              href="/admin/artists"
            >
              Temizle
            </Link>
          ) : null}
        </form>
      </section>
      <section className="panel p-4 sm:p-6">
        <SimpleTable
          columns={["Sanatçı", "Bağlı profil", "Tip", "Spotify", "Apple Music", "Oluşturma"]}
          rows={artists.map((artist) => [
            <Link className="font-semibold hover:underline" href={`/admin/artists/${artist.id}`} key={artist.id}>{artist.name}</Link>,
            (() => {
              const profile = artist.ownerUser ?? artist.createdByUser;
              return profile ? (
                <Link
                  className="block hover:text-accent hover:underline"
                  href={`/admin/users/${profile.id}`}
                  key={`${artist.id}-profile`}
                >
                  <span className="font-semibold">{profile.name}</span>
                  <span className="mt-1 block break-all text-xs text-muted">
                    {profile.username ? `@${profile.username}` : profile.email}
                  </span>
                </Link>
              ) : (
                <span key={`${artist.id}-profile`}>Profil bağlantısı yok</span>
              );
            })(),
            artist.type,
            artist.spotifyProfileUrl ?? "Yok",
            artist.appleMusicProfileUrl ?? "Yok",
            artist.createdAt.toLocaleDateString("tr-TR"),
          ])}
        />
      </section>
    </AdminShell>
  );
}
