import Link from "next/link";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { SimpleTable } from "@/features/admin/components/simple-table";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistService } from "@/features/artist/server/services/artist.service";

export default async function AdminArtistsPage() {
  const { organization } = await authSessionService.getDashboardContext();
  const artists = await artistService.listByOrganizationId(organization.organization.id);

  return (
    <AdminShell title="Sanatçılar" description="Organizasyona bağlı onaylı sanatçı profilleri ve label ilişkileri.">
      <section className="panel p-6">
        <SimpleTable
          columns={["Sanatçı", "Tip", "Spotify", "Apple Music", "Oluşturma"]}
          rows={artists.map((artist) => [
            <Link className="font-semibold hover:underline" href={`/admin/artists/${artist.id}`} key={artist.id}>{artist.name}</Link>,
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
