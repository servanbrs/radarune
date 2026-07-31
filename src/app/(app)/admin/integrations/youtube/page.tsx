import { AdminShell } from "@/features/admin/components/admin-shell";
import {
  assertAdminPermission,
} from "@/features/admin/server/admin-context";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { YouTubeCredentialForm } from "@/features/integrations/components/youtube-credential-form";
import { youtubeAdminCredentialService } from "@/features/integrations/server/services/youtube-admin-credential.service";

export const dynamic = "force-dynamic";

export default async function YouTubeIntegrationPage() {
  const { organization, user } =
    await authSessionService.getDashboardContext();

  const actor = {
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  };

  assertAdminPermission(
    actor,
    "integrations.youtube.view",
  );

  const status =
    await youtubeAdminCredentialService.getStatus(
      actor.organizationId,
    );

  return (
    <AdminShell
      description="YouTube Data API anahtarını organizasyon bazında güvenli şekilde kaydedin, test edin ve yönetin."
      title="YouTube entegrasyonu"
    >
      <YouTubeCredentialForm
        initialStatus={status}
      />
    </AdminShell>
  );
}
