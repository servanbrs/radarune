import { notFound } from "next/navigation";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistService } from "@/features/artist/server/services/artist.service";
import { labelService } from "@/features/label/server/services/label.service";
import { ReleaseWizard } from "@/features/releases/components/release-wizard";
import { PostSubmissionReleaseEditor } from "@/features/releases/components/post-submission-release-editor";
import { releaseService } from "@/features/releases/server/services/release.service";
import { canAccessAdmin } from "@/features/admin/server/admin-context";

type EditReleasePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditReleasePage({ params }: EditReleasePageProps) {
  const { id } = await params;
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = {
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  };
  const [release, artists, labels] = await Promise.all([
    releaseService.getRelease(actor, id),
    artistService.listByOrganizationId(organization.organization.id),
    labelService.listByOrganizationId(organization.organization.id),
  ]);

  if (!release) {
    notFound();
  }

  const adminMode = canAccessAdmin(actor);
  const draftEditable = adminMode || ["DRAFT", "REVISION_REQUESTED"].includes(release.status);
  const videoStores = Array.isArray(release.videoStores)
    ? release.videoStores.filter((value): value is string => typeof value === "string")
    : [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10 md:px-10">
      <div>
        <p className="text-xs font-semibold uppercase text-muted">{adminMode ? "Admin yayın düzenleme" : "Sanatçı yayın düzenleme"}</p>
        <h1 className="mt-2 text-3xl font-semibold">{release.title}</h1>
        <p className="mt-3 max-w-2xl rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-muted">{adminMode ? "Bu görünüm metadata, doğrulama ve moderasyon düzeltmeleri için kullanılır." : "Bu görünüm yalnızca size ait yayın metadata alanlarını ve parçalarınızı düzenlemek için kullanılır."}</p>
      </div>
      {draftEditable ? <ReleaseWizard
        artists={artists.map((artist) => ({ id: artist.id, name: artist.name }))}
        initialRelease={{
          ...release,
          artists: release.artists.map((artist) => ({
            artistId: artist.artistId,
            role: artist.role,
            sortOrder: artist.sortOrder,
          })),
          tracks: release.tracks.map((track) => ({
            ...track,
            artists: track.artists.map((artist) => ({
              artistId: artist.artistId,
              role: artist.role,
              sortOrder: artist.sortOrder,
            })),
            contributors: track.contributors.map((item) => ({
              name: item.contributor.name,
              role: item.role,
            })),
          })),
        }}
        labels={labels.map((label) => ({ id: label.id, name: label.name }))}
      /> : <PostSubmissionReleaseEditor
        releaseId={release.id}
        upc={release.upc}
        videoDistributionEnabled={release.videoDistributionEnabled}
        videoStores={videoStores}
        videoUploaded={Boolean(release.videoUploadId)}
        tracks={release.tracks.map((track) => ({ id: track.id, title: track.title, isrc: track.isrc }))}
      />}
    </main>
  );
}
