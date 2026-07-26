import "server-only";
import { rbacService } from "@/features/authorization/server/rbac";
import { distributionJobRepository } from "@/features/distribution-hub/server/repositories/distribution-job.repository";
import { distributionProviderConfigurationRepository } from "@/features/distribution-hub/server/repositories/provider-configuration.repository";
import { providerWebhookEventRepository } from "@/features/distribution-hub/server/repositories/provider-webhook-event.repository";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

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
}

export const adminDistributionService = new AdminDistributionService();
