import { notFound } from "next/navigation";
import { transferArtistOwnershipAction } from "@/features/admin/server/actions/admin-artist.actions";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { prisma } from "@/server/prisma/prisma";

export default async function AdminArtistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await authSessionService.getDashboardContext();
  const [artist, users] = await Promise.all([prisma.artist.findFirst({
    where: { id, organizationId: organization.organization.id },
    include: {
      ownerUser: { select: { id: true, name: true, email: true } },
      labelLinks: { include: { label: true } },
      releaseArtistLinks: { include: { release: true }, take: 20 },
    },
  }), prisma.user.findMany({
    where: {
      accountStatus: "ACTIVE",
      memberships: { some: { organizationId: organization.organization.id, status: "ACTIVE" } },
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  })]);
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
          <form action={async (formData) => { await transferArtistOwnershipAction(formData); }} className="mt-6 space-y-3 border-t border-line pt-5">
            <input type="hidden" name="artistId" value={artist.id} />
            <div>
              <h3 className="font-semibold">Kanal sahipliği</h3>
              <p className="mt-1 text-xs text-muted">Otomatik içe aktarılan veya sahipsiz kanalı gerçek sanatçı hesabına bağlayın.</p>
            </div>
            <select name="ownerUserId" defaultValue={artist.ownerUser?.id ?? ""} className="input">
              <option value="">Atanmamış (yalnızca admin)</option>
              {users.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.email}</option>)}
            </select>
            <button type="submit" className="button-primary">Kanalı devret</button>
          </form>
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
