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
import { aiProviderRegistry } from "@/features/intelligence/server/adapters/ai-provider-registry";

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

  async getSubmissionAssistant(actor: FinanceActorContext, releaseId: string) {
    const release = await intelligenceRepository.findReleaseDetail(releaseId);
    if (!release) throw new Error("Yayın bulunamadı.");
    releaseAccessService.assertCanViewRelease(actor, release);
    const validation = await this.validateRelease(actor, releaseId);
    const metadata = {
      title: release.title,
      versionTitle: release.versionTitle,
      type: release.type,
      language: release.primaryLanguage,
      genre: release.primaryGenre,
      secondaryGenre: release.secondaryGenre,
      plannedReleaseDate: release.plannedReleaseDate,
      originalReleaseDate: release.originalReleaseDate,
      previouslyReleased: release.previouslyReleased,
      upc: release.upc,
      stores: release.stores.map((store) => store.storeCode),
      artworkUploaded: release.uploads.some((upload) => upload.kind === "ARTWORK"),
      tracks: release.tracks.map((track) => ({ title: track.title, isrc: track.isrc, audioUploaded: Boolean(track.audioUploadId), instrumental: track.instrumental })),
    };
    const provider = aiProviderRegistry.get("OPENAI");
    const ai = await provider.analyzeStructuredMetadata({ metadata });
    const fallback = validation.issues.slice(0, 8).map((issue) => ({ field: issue.fieldPath, action: issue.suggestedAction ?? issue.message, priority: issue.blocking ? "high" : "medium" }));
    const structured = ai.success && ai.data.structuredResult && typeof ai.data.structuredResult === "object" ? ai.data.structuredResult as { summary?: string; suggestions?: unknown[] } : null;
    return {
      readiness: validation.readiness,
      issues: validation.issues,
      assistant: {
        provider: ai.success ? "OPENAI" : "INTERNAL_RULE_ENGINE",
        configured: ai.success,
        summary: structured?.summary ?? (validation.issues.length ? "Yayın gönderimden önce aşağıdaki alanları tamamlayın." : "Yayın gönderime hazır görünüyor."),
        suggestions: Array.isArray(structured?.suggestions) ? structured.suggestions : fallback,
        providerMessage: ai.success ? undefined : ai.message,
      },
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
