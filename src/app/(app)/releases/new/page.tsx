import { redirect } from "next/navigation";

import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { labelService } from "@/features/label/server/services/label.service";
import { ReleaseWizard } from "@/features/releases/components/release-wizard";
import { releaseAccessService } from "@/features/releases/server/services/release-access.service";

export default async function NewReleasePage() {
  const { organization, user } =
    await authSessionService.getDashboardContext();

  const actor = {
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
    email: user.email,
    name: user.name,
  };

  try {
    await releaseAccessService.assertCanCreateRelease(
      actor,
    );
  } catch {
    redirect(
      "/artist-application?reason=release-required",
    );
  }

  const manageableArtistIds =
    await releaseAccessService.listManageableArtistIds(
      actor,
    );

  if (manageableArtistIds.length === 0) {
    redirect(
      "/artist-application?reason=release-required",
    );
  }

  const [artists, labels] = await Promise.all([
    import("@/server/prisma/prisma").then(
      ({ prisma }) =>
        prisma.artist.findMany({
          where: {
            id: {
              in: manageableArtistIds,
            },
            organizationId:
              organization.organization.id,
          },
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
          },
        }),
    ),

    labelService.listByOrganizationId(
      organization.organization.id,
    ),
  ]);

  return (
    <main className="page-shell">
      <div className="flex min-w-0 w-full flex-col gap-6">
        <header className="panel p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Radarune dağıtım
          </p>

          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Yeni müzik gönder
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            Müziğiniz önce Radarune ekibi tarafından
            incelenecek. Uygun dağıtım sağlayıcısı
            inceleme sonrasında admin tarafından
            belirlenecektir.
          </p>
        </header>

        <ReleaseWizard
          artists={artists}
          labels={labels.map((label) => ({
            id: label.id,
            name: label.name,
          }))}
        />
      </div>
    </main>
  );
}