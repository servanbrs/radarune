import { AdminShell } from "@/features/admin/components/admin-shell";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { youtubeProviderService } from "@/features/integrations/server/adapters/youtube-provider.service";
import { IntegrationStatusCard } from "@/features/integrations/components/integration-status-card";
import { env } from "@/lib/env";

export default async function YouTubeIntegrationPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  assertAdminPermission(actor, "integrations.youtube.view");
  const status = youtubeProviderService.validateConfiguration();
  return <AdminShell title="YouTube entegrasyonu" description="API anahtarı yalnızca sunucu ortamından okunur; istemciye veya audit loglara gönderilmez."><IntegrationStatusCard configured={status.success} missing={[!env.YOUTUBE_API_KEY?"YOUTUBE_API_KEY":""].filter(Boolean)} provider="YouTube" /></AdminShell>;
}
