/* eslint-disable @next/next/no-img-element -- Artwork URLs come from private storage and are not known at build time. */
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { ReleaseStatusBadge } from "@/features/releases/components/release-status-badge";
import { ValidationSummary } from "@/features/releases/components/validation-summary";
import { releaseTypeLabels, storeLabels, type ReleaseStoreValue } from "@/features/releases/constants/release.constants";
import { releaseService } from "@/features/releases/server/services/release.service";
import { releaseDeliveryRepository } from "@/features/distribution-hub/server/repositories/release-delivery.repository";
import { releaseIntelligenceService } from "@/features/intelligence/server/services/release-intelligence.service";
import { DiscoverCommentForm } from "@/features/growth/components/discover-comment-form";
import { DiscoverLikeButton } from "@/features/growth/components/discover-like-button";
import { ArtistChannelLikeButton } from "@/features/growth/components/artist-channel-like-button";
import { ReleaseTrackRow } from "@/features/releases/components/release-track-row";
import { releaseIdTokenFromSlug, releasePublicPath } from "@/features/releases/lib/release-url";
import { prisma } from "@/server/prisma/prisma";

const deliveryStatusLabels: Record<string, string> = {
  ACCEPTED: "Kabul edildi",
  QUEUED: "Sıraya alındı",
  PROCESSING: "İşleniyor",
  DISTRIBUTED: "Dağıtıldı",
  LIVE: "Yayında",
  FAILED: "Başarısız",
  CANCELLED: "İptal edildi",
};

type ReleaseDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReleaseDetailPage({ params }: ReleaseDetailPageProps) {
  const { id } = await params;
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = {
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  };
  if (!id.includes("-") && id.startsWith("cms")) {
    const legacyRelease = await prisma.release.findFirst({ where: { id, organizationId: organization.organization.id }, select: { id: true, title: true } });
    if (legacyRelease) permanentRedirect(releasePublicPath(legacyRelease.title, legacyRelease.id));
  }
  const token = releaseIdTokenFromSlug(id);
  const resolvedId = token
    ? (await prisma.release.findFirst({ where: { organizationId: organization.organization.id, OR: [{ id: { startsWith: token } }, { id: { startsWith: `cms${token}` } }] }, select: { id: true } }))?.id
    : id;
  const release = await releaseService.getRelease(
    actor,
    resolvedId ?? id,
  );
  const deliveries = release
    ? await releaseDeliveryRepository.listByRelease(
        organization.organization.id,
        release.id,
      )
    : [];
  const intelligence = release
    ? await releaseIntelligenceService.getSummary(actor, release.id)
    : null;
  const engagement = release
    ? await Promise.all([
        prisma.releaseLike.count({ where: { releaseId: release.id } }),
        prisma.comment.count({ where: { releaseId: release.id, status: "VISIBLE", parentCommentId: null } }),
      ])
    : [0, 0];

  if (!release) {
    notFound();
  }
  const releaseArtistIds = release.artists.map((artist) => artist.artistId);
  const channelActors = releaseArtistIds.length
    ? await prisma.artist.findMany({
        where: {
          organizationId: organization.organization.id,
          id: { in: releaseArtistIds },
          ...(actor.systemRole === "ADMIN" || actor.systemRole === "SUPER_ADMIN"
            ? {}
            : {
                OR: [
                  { ownerUserId: user.id },
                  { createdByUserId: user.id, ownerUserId: null },
                  { teamMembers: { some: { userId: user.id, role: { in: ["OWNER", "MANAGER", "EDITOR"] } } } },
                ],
              }),
        },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      })
    : [];
  const artworkUpload = release.uploads.find((upload) => upload.id === release.artworkUploadId);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-7 sm:px-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted">Yayın detayı</p>
          <h1 className="mt-2 text-3xl font-semibold">{release.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <ReleaseStatusBadge status={release.status} />
            <span className="text-sm text-muted">{releaseTypeLabels[release.type]}</span>
          </div>
        </div>
        {["DRAFT", "REVISION_REQUESTED"].includes(release.status) ? (
          <Button variant="secondary">
            <Link href={`/releases/${release.id}/edit`}>
              {release.status === "DRAFT" ? "Yayını düzenle" : "Revizyon gönder"}
            </Link>
          </Button>
        ) : (
          <Button variant="secondary">
            <Link href={`/contact?subject=${encodeURIComponent(`${release.title} yayını için destek`)}`}>Destek ekibine yaz</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-line bg-surface p-5 lg:row-span-2">
          <h2 className="text-xl font-semibold">Kapak görseli</h2>
          {artworkUpload ? <img alt={`${release.title} kapak görseli`} className="mx-auto mt-5 aspect-square w-full max-w-[240px] rounded-2xl object-cover shadow-sm" src={`/api/storage/private/${artworkUpload.id}`} /> : <div className="mx-auto mt-5 grid aspect-square w-full max-w-[240px] place-items-center rounded-2xl border border-dashed border-line bg-surface-strong text-center text-sm text-muted">Henüz kapak yüklenmedi.<br />Yayın düzenleme ekranından kapak ekleyin.</div>}
        </section>
        <section className="rounded-3xl border border-line bg-surface p-6">
          <h2 className="text-xl font-semibold">Yayın bilgileri</h2>
          <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
            <DetailItem label="Birincil dil" value={release.primaryLanguage} />
            <DetailItem label="Tür" value={release.primaryGenre} />
            <DetailItem label="Alt tür" value={release.secondaryGenre ?? "Belirtilmedi"} />
            <DetailItem label="UPC" value={release.upc ?? "Sağlayıcı atayabilir"} />
            <DetailItem label="P telif" value={release.copyrightP} />
            <DetailItem label="C telif" value={release.copyrightC} />
          </dl>
        </section>

        <section className="rounded-3xl border border-line bg-surface p-6">
          <h2 className="text-xl font-semibold">Dağıtım</h2>
          <dl className="mt-5 grid gap-4 text-sm">
            <DetailItem label="Dağıtım hizmeti" value="Radarune Dağıtımı" />
            <DetailItem label="Mağazalar" value={release.stores.map((store) => storeLabels[store.storeCode as ReleaseStoreValue] ?? store.storeCode).join(", ") || "Seçilmedi"} />
            <DetailItem label="Bölgeler" value={release.worldwideDistribution ? "Dünya geneli" : release.territories.map((territory) => territory.territoryCode).join(", ")} />
          </dl>
        </section>
      </div>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Parçalar</h2>
            <p className="mt-1 text-sm text-muted">Yayın detayından dinleyin, oy verin ve yorumları takip edin.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-muted"><span>{engagement[0]} oy</span><span>{engagement[1]} yorum</span><DiscoverLikeButton releaseId={release.id} /><ArtistChannelLikeButton actors={channelActors} releaseId={release.id} /></div>
        </div>
        <div className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface-strong">
          {release.tracks.map((track) => (
            <ReleaseTrackRow audioUploadId={track.audioUploadId} artists={track.artists.map((artist) => artist.artist.name).join(", ")} isrc={track.isrc} key={track.id} number={track.trackNumber} title={track.title} />
          ))}
        </div>
        <DiscoverCommentForm channelActors={channelActors} releaseId={release.id} isAuthenticated />
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-xl font-semibold">Dağıtım durumu</h2>
        <div className="mt-5 divide-y divide-line rounded-2xl border border-line bg-surface-strong">
          {deliveries.map((delivery) => (
            <article className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[0.6fr_1fr]" key={delivery.id}>
              <span className="font-semibold">{deliveryStatusLabels[delivery.status] ?? "İşlem durumu güncelleniyor"}</span>
              <span>{delivery.failureReason ?? (delivery.externalReleaseId ? "Dağıtım kaydı oluşturuldu" : "Radarune dağıtım işlemi devam ediyor")}</span>
            </article>
          ))}
          {deliveries.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted">Bu yayın için henüz dağıtım kaydı yok.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-muted">Radarune zekâ</p>
            <h2 className="mt-2 text-xl font-semibold">Yayın hazırlık skoru</h2>
          </div>
          <span className="rounded-full border border-line bg-surface-strong px-4 py-2 text-sm font-semibold">
            Skor: {intelligence?.readiness?.score ?? "Henüz hesaplanmadı"}
          </span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <DetailItem label="Engelleyici hata" value={String(intelligence?.readiness?.blockingCount ?? release.validationIssues.filter((issue) => issue.blocking).length)} />
          <DetailItem label="Uyarı" value={String(intelligence?.readiness?.warningCount ?? release.validationIssues.filter((issue) => issue.severity === "WARNING").length)} />
          <DetailItem label="Son analiz" value={intelligence?.readiness?.createdAt.toLocaleString("tr-TR") ?? "Yok"} />
        </div>
        <p className="mt-4 text-sm leading-7 text-muted">
          Yayın doğrulaması ve hazırlık hesabı dağıtım sağlayıcısından bağımsızdır. Harici yapay zekâ bağlantısı kurulmadan metadata önerisi veya görsel analizi üretilmez.
        </p>
      </section>

      <ValidationSummary issues={release.validationIssues} />
    </main>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-muted">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
