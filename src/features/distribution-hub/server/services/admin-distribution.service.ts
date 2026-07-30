import "server-only";
import { rbacService } from "@/features/authorization/server/rbac";
import { distributionJobRepository } from "@/features/distribution-hub/server/repositories/distribution-job.repository";
import { distributionProviderConfigurationRepository } from "@/features/distribution-hub/server/repositories/provider-configuration.repository";
import { providerWebhookEventRepository } from "@/features/distribution-hub/server/repositories/provider-webhook-event.repository";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import type { DistributionJobStatus, DistributionProviderKey } from "@/features/distribution-hub/domain/provider";

function assertView(actor: FinanceActorContext) {
  if (
    !rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      systemRole: actor.systemRole,
      permission: "distribution:view",
    })
  ) {
    throw new Error("Distribution Center görüntüleme yetkiniz yok.");
  }
}

export class AdminDistributionService {
  async listJobs(actor: FinanceActorContext) {
    assertView(actor);
    return distributionJobRepository.listByOrganization(actor.organizationId);
  }

  async getJob(actor: FinanceActorContext, jobId: string) {
    assertView(actor);
    const job = await distributionJobRepository.findById(jobId);
    return job && job.organizationId === actor.organizationId ? job : null;
  }

  async listWebhooks(actor: FinanceActorContext) {
    assertView(actor);
    return providerWebhookEventRepository.listByOrganization(actor.organizationId);
  }

  async listHealthChecks(actor: FinanceActorContext) {
    assertView(actor);
    return distributionProviderConfigurationRepository.listHealthChecksByOrganization(
      actor.organizationId,
    );
  }

  async updateJob(actor: FinanceActorContext, jobId: string, input: { status?: DistributionJobStatus; provider?: DistributionProviderKey; providerConfigurationId?: string | null }) {
    if (!rbacService.hasEffectivePermission({ membershipRole: actor.membershipRole, systemRole: actor.systemRole, permission: "distribution:manage" })) throw new Error("Dağıtım job yönetme yetkiniz yok.");
    const job = await distributionJobRepository.findById(jobId);
    if (!job || job.organizationId !== actor.organizationId) throw new Error("Distribution job bulunamadı.");
    const providerConfigurationId = input.providerConfigurationId;
    if (providerConfigurationId) {
      const configs = await distributionProviderConfigurationRepository.listByOrganizationId(actor.organizationId);
      const config = configs.find((item) => item.id === providerConfigurationId);
      if (!config) throw new Error("Provider yapılandırması bulunamadı.");
      if (input.provider && config.provider !== input.provider) throw new Error("Provider ve yapılandırma eşleşmiyor.");
    }
    return distributionJobRepository.updateStatus(jobId, {
      status: input.status ?? job.status,
      ...(input.provider ? { provider: input.provider } : {}),
      ...(providerConfigurationId !== undefined ? { providerConfigurationId } : {}),
      ...(input.status === "QUEUED" ? { queuedAt: new Date(), nextAttemptAt: new Date(), cancelledAt: null, completedAt: null } : {}),
      ...(input.status === "CANCELLED" ? { cancelledAt: new Date() } : {}),
      ...(input.status === "SUCCEEDED" || input.status === "PARTIALLY_SUCCEEDED" ? { completedAt: new Date() } : {}),
    });
  }
}

export const adminDistributionService = new AdminDistributionService();
