import "server-only";
import { stableHash } from "@/features/intelligence/lib/hash";
import { entitlementService } from "@/features/billing/server/services/entitlement.service";
import { intelligenceRepository } from "@/features/intelligence/server/repositories/intelligence.repository";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import type { StartReleaseIntelligenceInput } from "@/features/intelligence/schemas/intelligence.schema";

export class AiJobService {
  async enqueueReleaseJobs(actor: FinanceActorContext, release: { id: string; organizationId: string }, input: StartReleaseIntelligenceInput) {
    if (input.jobTypes.includes("METADATA_ANALYSIS")) {
      await entitlementService.assertFeatureEnabled({ organizationId: actor.organizationId }, "ai.metadata.enabled");
    }
    if (input.jobTypes.includes("ARTWORK_ANALYSIS")) {
      await entitlementService.assertFeatureEnabled({ organizationId: actor.organizationId }, "ai.artwork.enabled");
    }
    if (input.jobTypes.includes("AUDIO_ANALYSIS")) {
      await entitlementService.assertFeatureEnabled({ organizationId: actor.organizationId }, "ai.audio.enabled");
    }

    const jobs = [];
    for (const jobType of input.jobTypes) {
      const inputHash = stableHash({ releaseId: release.id, jobType });
      jobs.push(
        await intelligenceRepository.createJob({
          organizationId: release.organizationId,
          releaseId: release.id,
          requestedByUserId: actor.userId,
          jobType,
          inputHash,
          idempotencyKey: stableHash({ organizationId: release.organizationId, releaseId: release.id, jobType, inputHash }),
        }),
      );
    }
    return jobs;
  }

  async listJobs(actor: FinanceActorContext) {
    return intelligenceRepository.listJobs(actor.organizationId);
  }
}

export const aiJobService = new AiJobService();
