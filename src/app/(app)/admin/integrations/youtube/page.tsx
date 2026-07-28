import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { youtubeProviderService } from "@/features/integrations/server/adapters/youtube-provider.service";
import { IntegrationStatusCard } from "@/features/integrations/components/integration-status-card";
import { integrationCredentialService } from "@/features/integrations/server/services/integration-credential.service";

export default async function YouTubeIntegrationPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  assertAdminPermission(actor, "integrations.youtube.view");
  const status = youtubeProviderService.validateConfiguration();
  const saved = await integrationCredentialService.runtime(actor.organizationId, "YOUTUBE");
  const configured = status.success || Boolean(saved?.apiKey);
  return <AdminShell title="YouTube entegrasyonu" description="API anahtarı yalnızca sunucu ortamından okunur; istemciye veya audit loglara gönderilmez."><IntegrationStatusCard configured={configured} missing={configured ? [] : ["YOUTUBE_API_KEY"]} provider="YouTube" /></AdminShell>;
}
