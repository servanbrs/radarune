import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { distributionProviderConfigurationService } from "@/features/distribution-hub/server/services/provider-configuration.service";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { ProviderConfigurationForm } from "@/features/distribution-hub/components/provider-configuration-form";

export default async function AdminDistributionProvidersPage() {
  const { organization, user } = await authSessionService.getDashboardContext();
  rbacService.redirectIfMissingEffectivePermission({
    membershipRole: organization.role,
    permission: "distribution:view",
    systemRole: user.systemRole,
  });

  const providers = await distributionProviderConfigurationService.listByOrganization({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  return <AdminShell title="Dağıtım provider yönetimi" description="Provider credential, yetenek, webhook ve bağlantı testlerini tek merkezden yönetin."><ProviderConfigurationForm initial={providers} /></AdminShell>;
}
