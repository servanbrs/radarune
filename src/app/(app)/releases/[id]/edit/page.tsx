import { notFound } from "next/navigation";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistService } from "@/features/artist/server/services/artist.service";
import { labelService } from "@/features/label/server/services/label.service";
import { ReleaseWizard } from "@/features/releases/components/release-wizard";
import { releaseService } from "@/features/releases/server/services/release.service";

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

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10 md:px-10">
      <div>
        <p className="text-xs font-semibold uppercase text-muted">Yayın düzenle</p>
        <h1 className="mt-2 text-3xl font-semibold">{release.title}</h1>
      </div>
      <ReleaseWizard
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
          })),
        }}
        labels={labels.map((label) => ({ id: label.id, name: label.name }))}
      />
    </main>
  );
}
