import { notFound } from "next/navigation";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { prisma } from "@/server/prisma/prisma";

export default async function AdminArtistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await authSessionService.getDashboardContext();
  const artist = await prisma.artist.findFirst({
    where: { id, organizationId: organization.organization.id },
    include: {
      ownerUser: { select: { id: true, name: true, email: true } },
      labelLinks: { include: { label: true } },
      releaseArtistLinks: { include: { release: true }, take: 20 },
    },
  });
  if (!artist) {
    notFound();
  }

  return (
    <AdminShell title={artist.name} description="Sanatçı profili, sahip kullanıcı, label bağlantıları ve ilişkili yayınlar.">
      <section className="grid gap-6 xl:grid-cols-2">
        <article className="panel p-6">
          <h2 className="text-lg font-semibold">Profil</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p>Tip: {artist.type}</p>
            <p>Sahip kullanıcı: {artist.ownerUser ? `${artist.ownerUser.name} · ${artist.ownerUser.email}` : "Yok"}</p>
            <p>Spotify: {artist.spotifyProfileUrl ?? "Yok"}</p>
            <p>Apple Music: {artist.appleMusicProfileUrl ?? "Yok"}</p>
          </div>
        </article>
        <article className="panel p-6">
          <h2 className="text-lg font-semibold">Label bağlantıları</h2>
          <div className="mt-4 space-y-2 text-sm">
            {artist.labelLinks.map((link) => <p key={link.id}>{link.label.name}</p>)}
          </div>
        </article>
      </section>
    </AdminShell>
  );
}
