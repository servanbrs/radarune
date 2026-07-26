import "server-only";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";

export async function getAdminIntelligenceActor() {
  const { organization, user } = await authSessionService.getDashboardContext();

  return toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
}
