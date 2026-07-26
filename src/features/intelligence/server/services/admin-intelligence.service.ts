import "server-only";
import { rbacService, type AppPermission } from "@/features/authorization/server/rbac";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { intelligenceRepository } from "@/features/intelligence/server/repositories/intelligence.repository";

export class AdminIntelligenceService {
  async getOverview(actor: FinanceActorContext) {
    this.assert(actor, "admin.intelligence.view");
    const [jobs, providers, usage] = await Promise.all([
      intelligenceRepository.listJobs(actor.organizationId),
      intelligenceRepository.listProviders(actor.organizationId),
      intelligenceRepository.getUsageSummary(actor.organizationId),
    ]);

    return {
      jobs: jobs.slice(0, 10),
      providers,
      usage,
    };
  }

  async listJobs(actor: FinanceActorContext) {
    this.assert(actor, "admin.intelligence.view");
    return intelligenceRepository.listJobs(actor.organizationId);
  }

  async listProviders(actor: FinanceActorContext) {
    this.assert(actor, "admin.intelligence.providers.manage");
    return intelligenceRepository.listProviders(actor.organizationId);
  }

  async listPromptTemplates(actor: FinanceActorContext) {
    this.assert(actor, "admin.intelligence.prompts.manage");
    return intelligenceRepository.listPromptTemplates();
  }

  async listRuleProfiles(actor: FinanceActorContext) {
    this.assert(actor, "admin.intelligence.rules.manage");
    return intelligenceRepository.listRuleProfiles(actor.organizationId);
  }

  async listDuplicateMatches(actor: FinanceActorContext) {
    this.assert(actor, "admin.intelligence.duplicates.review");
    return intelligenceRepository.listDuplicateMatches(actor.organizationId);
  }

  async getUsage(actor: FinanceActorContext) {
    this.assert(actor, "admin.intelligence.view");
    return intelligenceRepository.getUsageSummary(actor.organizationId);
  }

  private assert(actor: FinanceActorContext, permission: AppPermission) {
    rbacService.assertEffectivePermission({
      membershipRole: actor.membershipRole,
      systemRole: actor.systemRole,
      permission,
    });
  }
}

export const adminIntelligenceService = new AdminIntelligenceService();
