import { notFound } from "next/navigation";
import Link from "next/link";
import { ArtistChannelOwnershipForm } from "@/features/admin/components/artist-channel-ownership-form";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { prisma } from "@/server/prisma/prisma";

export default async function AdminArtistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await authSessionService.getDashboardContext();
  const artist = await prisma.artist.findFirst({
    where: { id, organizationId: organization.organization.id },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      spotifyProfileUrl: true,
      appleMusicProfileUrl: true,
      ownerUser: { select: { id: true, name: true, email: true } },
    },
  });
  if (!artist) {
    notFound();
  }

  // Load the channel's releases in one query so the admin can see the
  // complete catalogue and jump straight to the release editor. Metrics are
  // grouped below to avoid one database request per track.
  const [usersResult, labelsResult, releaseLinksResult] = await Promise.allSettled([
    prisma.user.findMany({
      where: {
        accountStatus: "ACTIVE",
        memberships: { some: { organizationId: organization.organization.id, status: "ACTIVE" } },
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.labelArtist.findMany({
      where: { artistId: artist.id },
      select: { id: true, label: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.releaseArtist.findMany({
      where: {
        artistId: artist.id,
        release: { organizationId: organization.organization.id },
      },
      orderBy: { createdAt: "desc" },
      select: {
        release: {
          select: {
            id: true,
            title: true,
            status: true,
            upc: true,
            createdAt: true,
            liveAt: true,
            tracks: {
              orderBy: [{ discNumber: "asc" }, { trackNumber: "asc" }],
              select: {
                id: true,
                title: true,
                discNumber: true,
                trackNumber: true,
                isrc: true,
              },
            },
          },
        },
      },
    }),
  ]);
  const users = usersResult.status === "fulfilled" ? usersResult.value : [];
  const labelLinks = labelsResult.status === "fulfilled" ? labelsResult.value : [];
  const releaseLinks = releaseLinksResult.status === "fulfilled" ? releaseLinksResult.value : [];

  // An artist can be attached to the same release with more than one role.
  // De-duplicate it here before rendering the catalogue and calculating totals.
  const releases = [...new Map(releaseLinks.map((link) => [link.release.id, link.release])).values()];
  const tracks = releases.flatMap((release) => release.tracks.map((track) => ({ ...track, release })));
  const trackIds = tracks.map((track) => track.id);
  const [streamRows, viewRows] = trackIds.length
    ? await Promise.all([
        prisma.playbackSession.groupBy({
          by: ["trackId"],
          where: {
            organizationId: organization.organization.id,
            trackId: { in: trackIds },
            streamCountedAt: { not: null },
          },
          _count: { _all: true },
        }),
        prisma.discoverEvent.groupBy({
          by: ["trackId"],
          where: {
            organizationId: organization.organization.id,
            trackId: { in: trackIds },
            eventType: "IMPRESSION",
          },
          _count: { _all: true },
        }),
      ])
    : [[], []];
  const streamCounts = new Map(streamRows.map((row) => [row.trackId, row._count._all]));
  const viewCounts = new Map(viewRows.map((row) => [row.trackId, row._count._all]));
  const totalStreams = tracks.reduce((sum, track) => sum + (streamCounts.get(track.id) ?? 0), 0);
  const totalViews = tracks.reduce((sum, track) => sum + (viewCounts.get(track.id) ?? 0), 0);

  return (
    <AdminShell title={artist.name} description="Sanatçı profili, sahip kullanıcı, katalog ve kanal istatistikleri.">
      <section className="grid gap-6 xl:grid-cols-2">
        <article className="panel p-6">
          <h2 className="text-lg font-semibold">Profil</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p>Tip: {artist.type}</p>
            <p>Sahip kullanıcı: {artist.ownerUser ? `${artist.ownerUser.name} · ${artist.ownerUser.email}` : "Yok"}</p>
            <p>Spotify: {artist.spotifyProfileUrl ?? "Yok"}</p>
            <p>Apple Music: {artist.appleMusicProfileUrl ?? "Yok"}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
            <Link href={`/dashboard/artists/${artist.id}/profile`} className="button-primary">Profili düzenle</Link>
            <Link href={`/artist/${artist.slug}`} className="button-secondary">Herkese açık profili gör</Link>
          </div>
          <ArtistChannelOwnershipForm artistId={artist.id} currentOwnerId={artist.ownerUser?.id ?? null} users={users} />
        </article>
        <article className="panel p-6">
          <h2 className="text-lg font-semibold">Label bağlantıları</h2>
          <div className="mt-4 space-y-2 text-sm">
            {labelLinks.map((link) => <p key={link.id}>{link.label.name}</p>)}
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Toplam şarkı</p>
          <p className="mt-3 text-3xl font-semibold">{tracks.length}</p>
          <p className="mt-1 text-sm text-muted">{releases.length} yayın içinde</p>
        </article>
        <article className="panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Toplam dinlenme</p>
          <p className="mt-3 text-3xl font-semibold">{totalStreams.toLocaleString("tr-TR")}</p>
          <p className="mt-1 text-sm text-muted">Geçerli stream kayıtları</p>
        </article>
        <article className="panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Toplam görüntülenme</p>
          <p className="mt-3 text-3xl font-semibold">{totalViews.toLocaleString("tr-TR")}</p>
          <p className="mt-1 text-sm text-muted">Keşfet gösterimleri</p>
        </article>
        <article className="panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Yayın durumu</p>
          <p className="mt-3 text-3xl font-semibold">{releases.filter((release) => ["APPROVED", "DISTRIBUTED", "LIVE"].includes(release.status)).length}</p>
          <p className="mt-1 text-sm text-muted">Onaylı veya yayındaki yayın</p>
        </article>
      </section>

      <section className="panel mt-6 overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Sanatçı kataloğu</p>
            <h2 className="mt-2 text-xl font-semibold">Şarkılar ve performans</h2>
          </div>
          <p className="text-sm text-muted">Her satırdan ilgili yayını düzenleyebilirsin.</p>
        </div>
        {tracks.length ? (
          <div className="divide-y divide-line">
            {tracks.map((track) => (
              <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center" key={track.id}>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{track.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {track.release.title} · {track.discNumber}.{track.trackNumber} · ISRC: {track.isrc ?? "Bekliyor"}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {track.release.status} · {track.release.upc ? `UPC: ${track.release.upc}` : "UPC bekliyor"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded-full border border-line bg-surface-strong px-3 py-1.5">{(streamCounts.get(track.id) ?? 0).toLocaleString("tr-TR")} dinlenme</span>
                  <span className="rounded-full border border-line bg-surface-strong px-3 py-1.5">{(viewCounts.get(track.id) ?? 0).toLocaleString("tr-TR")} görüntülenme</span>
                  <Link className="button-secondary" href={`/releases/${track.release.id}/edit`}>Şarkıyı düzenle</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-6 text-sm text-muted">Bu sanatçıya bağlı şarkı bulunamadı.</p>
        )}
      </section>
    </AdminShell>
  );
}
