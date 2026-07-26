import "server-only";
import { rbacService } from "@/features/authorization/server/rbac";
import { entitlementService } from "@/features/billing/server/services/entitlement.service";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { startReleaseIntelligenceSchema, type StartReleaseIntelligenceInput } from "@/features/intelligence/schemas/intelligence.schema";
import { aiJobService } from "@/features/intelligence/server/services/ai-job.service";
import { artworkAnalysisService } from "@/features/intelligence/server/services/artwork-analysis.service";
import { audioAnalysisService } from "@/features/intelligence/server/services/audio-analysis.service";
import { duplicateDetectionService } from "@/features/intelligence/server/services/audio-fingerprint.service";
import { intelligenceRepository } from "@/features/intelligence/server/repositories/intelligence.repository";
import { metadataValidationService } from "@/features/intelligence/server/services/metadata-validation.service";
import { releaseReadinessService } from "@/features/intelligence/server/services/release-readiness.service";
import { releaseAccessService } from "@/features/releases/server/services/release-access.service";

export class ReleaseIntelligenceService {
  async validateRelease(actor: FinanceActorContext, releaseId: string) {
    const release = await intelligenceRepository.findReleaseDetail(releaseId);
    if (!release) {
      throw new Error("Yayın bulunamadı.");
    }

    releaseAccessService.assertCanViewRelease(actor, release);
    const issues = metadataValidationService.validateRelease(release);
    const inputHash = metadataValidationService.buildInputHash(release);

    await intelligenceRepository.replaceValidationIssues({
      organizationId: release.organizationId,
      releaseId: release.id,
      inputHash,
      issues,
    });

    const readiness = await releaseReadinessService.persist({
      organizationId: release.organizationId,
      releaseId: release.id,
      issues,
      inputHash: releaseReadinessService.buildInputHash(issues),
    });

    return { issues, readiness };
  }

  async startAnalysis(actor: FinanceActorContext, input: StartReleaseIntelligenceInput) {
    const parsed = startReleaseIntelligenceSchema.parse(input);
    const release = await intelligenceRepository.findReleaseDetail(parsed.releaseId);
    if (!release) {
      throw new Error("Yayın bulunamadı.");
    }
    releaseAccessService.assertCanViewRelease(actor, release);

    if (parsed.jobTypes.includes("METADATA_ANALYSIS")) {
      await entitlementService.assertWithinLimit({ organizationId: actor.organizationId }, "ai.metadata.monthly_limit");
    }

    const validation = await this.validateRelease(actor, release.id);
    const jobs = await aiJobService.enqueueReleaseJobs(actor, release, parsed);

    if (parsed.jobTypes.includes("ARTWORK_ANALYSIS")) {
      await artworkAnalysisService.analyze(release);
    }
    if (parsed.jobTypes.includes("AUDIO_ANALYSIS")) {
      for (const track of release.tracks) {
        await audioAnalysisService.analyze(release, track);
      }
    }
    if (parsed.jobTypes.includes("DUPLICATE_DETECTION")) {
      for (const track of release.tracks) {
        await duplicateDetectionService.detectExactMatches(release, track);
      }
    }

    await auditLogService.create({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "RELEASE_INTELLIGENCE_STARTED",
      entityType: "Release",
      entityId: release.id,
      metadata: {
        jobTypes: parsed.jobTypes,
        issueCount: validation.issues.length,
      },
    });

    return { jobs, validation };
  }

  async getSummary(actor: FinanceActorContext, releaseId: string) {
    const release = await intelligenceRepository.findReleaseDetail(releaseId);
    if (!release) {
      throw new Error("Yayın bulunamadı.");
    }
    releaseAccessService.assertCanViewRelease(actor, release);

    const readiness = await intelligenceRepository.latestReadinessScore(release.organizationId, release.id);
    return {
      readiness,
      validationIssues: release.validationIssues,
    };
  }

  async listAdminJobs(actor: FinanceActorContext) {
    const allowed = rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      systemRole: actor.systemRole,
      permission: "admin.intelligence.view",
    });
    if (!allowed) {
      throw new Error("Intelligence job kayıtlarını görüntüleme yetkiniz yok.");
    }
    return aiJobService.listJobs(actor);
  }
}

export const releaseIntelligenceService = new ReleaseIntelligenceService();
