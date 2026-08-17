import { notFound } from "next/navigation";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { artistProfileService } from "@/features/artist/server/services/artist-profile.service";
import { ArtistProfileEditor } from "@/features/artist/components/artist-profile-editor";

export default async function ArtistProfileEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { organization, user } = await authSessionService.getDashboardContext();
  const { id } = await params;
  const artist = await artistProfileService.getEditable({
    organizationId: organization.organization.id,
    userId: user.id,
    systemRole: user.systemRole,
    artistId: id,
  });
  if (!artist) notFound();
  return <ArtistProfileEditor artist={artist} />;
}
