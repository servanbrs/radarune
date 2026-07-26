import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistService } from "@/features/artist/server/services/artist.service";
import { labelService } from "@/features/label/server/services/label.service";
import { ReleaseWizard } from "@/features/releases/components/release-wizard";

export default async function NewReleasePage() {
  const { organization } = await authSessionService.getDashboardContext();
  const [artists, labels] = await Promise.all([
    artistService.listByOrganizationId(organization.organization.id),
    labelService.listByOrganizationId(organization.organization.id),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10 md:px-10">
      <div>
        <p className="text-xs font-semibold uppercase text-muted">Yeni yayın</p>
        <h1 className="mt-2 text-3xl font-semibold">Release Wizard</h1>
      </div>
      <ReleaseWizard
        artists={artists.map((artist) => ({ id: artist.id, name: artist.name }))}
        labels={labels.map((label) => ({ id: label.id, name: label.name }))}
      />
    </main>
  );
}
