import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

export class IntelligenceRepository {
  async findReleaseDetail(releaseId: string, client: DatabaseClient = prisma) {
    return client.release.findUnique({
      where: { id: releaseId },
      include: {
        artists: { include: { artist: true } },
        contributors: true,
        stores: true,
        territories: true,
        uploads: true,
        tracks: {
          orderBy: [{ discNumber: "asc" }, { trackNumber: "asc" }],
          include: {
            artists: { include: { artist: true } },
            contributors: { include: { contributor: true } },
            uploads: true,
          },
        },
        validationIssues: { where: { resolvedAt: null } },
      },
    });
  }

  async replaceValidationIssues(
    input: {
      organizationId: string;
      releaseId: string;
      inputHash: string;
      issues: Array<{
        fieldPath: string;
        step: string;
        code: string;
        category: NonNullable<Prisma.ReleaseValidationIssueCreateManyInput["category"]>;
        title: string;
        message: string;
        suggestedAction?: string;
        severity: NonNullable<Prisma.ReleaseValidationIssueCreateManyInput["severity"]>;
        blocking: boolean;
        source: NonNullable<Prisma.ReleaseValidationIssueCreateManyInput["source"]>;
        trackId?: string;
        metadata?: Prisma.InputJsonValue;
      }>;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.releaseValidationIssue.deleteMany({
        where: {
          releaseId: input.releaseId,
          source: { in: ["RULE_ENGINE", "PROVIDER_RULE"] },
          resolvedAt: null,
        },
      });

      if (input.issues.length > 0) {
        await tx.releaseValidationIssue.createMany({
          data: input.issues.map((issue) => ({
            organizationId: input.organizationId,
            releaseId: input.releaseId,
            trackId: issue.trackId ?? null,
            fieldPath: issue.fieldPath,
            step: issue.step,
            code: issue.code,
            category: issue.category,
            title: issue.title,
            message: issue.message,
            suggestedAction: issue.suggestedAction ?? null,
            severity: issue.severity,
            blocking: issue.blocking,
            source: issue.source,
            metadata: issue.metadata ?? Prisma.JsonNull,
          })),
        });
      }

      return tx.validationRun.create({
        data: {
          organizationId: input.organizationId,
          releaseId: input.releaseId,
          inputHash: input.inputHash,
          issueCount: input.issues.length,
          blockingCount: input.issues.filter((issue) => issue.blocking).length,
        },
      });
    });
  }

  async createJob(
    input: {
      organizationId: string;
      releaseId?: string;
      trackId?: string;
      uploadId?: string;
      requestedByUserId?: string;
      jobType: Prisma.AiAnalysisJobCreateInput["jobType"];
      inputHash: string;
      idempotencyKey: string;
    },
    client: DatabaseClient = prisma,
  ) {
    return client.aiAnalysisJob.upsert({
      where: { organizationId_jobType_inputHash: { organizationId: input.organizationId, jobType: input.jobType, inputHash: input.inputHash } },
      update: {},
      create: {
        organizationId: input.organizationId,
        releaseId: input.releaseId ?? null,
        trackId: input.trackId ?? null,
        uploadId: input.uploadId ?? null,
        requestedByUserId: input.requestedByUserId ?? null,
        jobType: input.jobType,
        status: "QUEUED",
        inputHash: input.inputHash,
        idempotencyKey: input.idempotencyKey,
        queuedAt: new Date(),
      },
      select: { id: true, status: true, jobType: true, inputHash: true },
    });
  }

  async listJobs(organizationId: string) {
    return prisma.aiAnalysisJob.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { provider: true, attempts: { orderBy: { startedAt: "desc" }, take: 3 } },
    });
  }

  async getJob(organizationId: string, jobId: string) {
    return prisma.aiAnalysisJob.findFirst({
      where: { id: jobId, organizationId },
      include: { provider: true, attempts: true },
    });
  }

  async listProviders(organizationId: string) {
    return prisma.aiProvider.findMany({
      where: {
        OR: [{ organizationId }, { organizationId: null }],
      },
      orderBy: [{ active: "desc" }, { priority: "asc" }, { code: "asc" }],
      include: {
        capabilities: true,
        credentials: {
          select: {
            id: true,
            keyName: true,
            maskedValue: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async listRuleProfiles(organizationId: string) {
    return prisma.providerRuleProfile.findMany({
      where: {
        OR: [{ organizationId }, { organizationId: null }],
      },
      orderBy: [{ active: "desc" }, { code: "asc" }, { version: "desc" }],
      include: {
        rules: {
          orderBy: [{ active: "desc" }, { category: "asc" }, { code: "asc" }],
        },
      },
    });
  }

  async listPromptTemplates() {
    return prisma.aiPromptTemplate.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
  }

  async listDuplicateMatches(organizationId: string) {
    return prisma.duplicateAudioMatch.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        release: { select: { id: true, title: true } },
        track: { select: { id: true, title: true } },
        matchedOrganization: { select: { id: true, name: true } },
      },
    });
  }

  async getUsageSummary(organizationId: string) {
    const [usageByType, jobStatus, latestReadiness, pendingSuggestions] = await Promise.all([
      prisma.aiUsageRecord.groupBy({
        by: ["usageType"],
        where: { organizationId },
        _sum: { unitCount: true, costMinor: true },
        _count: { _all: true },
      }),
      prisma.aiAnalysisJob.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: { _all: true },
      }),
      prisma.releaseReadinessScore.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { release: { select: { id: true, title: true } } },
      }),
      prisma.metadataSuggestion.count({
        where: { organizationId, status: "PENDING" },
      }),
    ]);

    return {
      usageByType,
      jobStatus,
      latestReadiness,
      pendingSuggestions,
    };
  }

  async createArtworkAnalysis(
    input: Prisma.ArtworkAnalysisUncheckedCreateInput,
    issues: Prisma.ArtworkAnalysisIssueUncheckedCreateWithoutAnalysisInput[] = [],
    client: DatabaseClient = prisma,
  ) {
    const analysis = await client.artworkAnalysis.create({ data: input });

    if (issues.length > 0) {
      await client.artworkAnalysisIssue.createMany({
        data: issues.map((issue) => ({
          ...issue,
          analysisId: analysis.id,
        })),
      });
    }

    return client.artworkAnalysis.findUniqueOrThrow({
      where: { id: analysis.id },
      include: { issues: true },
    });
  }

  async createAudioAnalysis(
    input: Prisma.AudioAnalysisUncheckedCreateInput,
    issues: Prisma.AudioAnalysisIssueUncheckedCreateWithoutAnalysisInput[] = [],
    client: DatabaseClient = prisma,
  ) {
    const analysis = await client.audioAnalysis.create({ data: input });

    if (issues.length > 0) {
      await client.audioAnalysisIssue.createMany({
        data: issues.map((issue) => ({
          ...issue,
          analysisId: analysis.id,
        })),
      });
    }

    return client.audioAnalysis.findUniqueOrThrow({
      where: { id: analysis.id },
      include: { issues: true },
    });
  }

  async upsertAudioFingerprint(input: Prisma.AudioFingerprintUncheckedCreateInput, client: DatabaseClient = prisma) {
    return client.audioFingerprint.upsert({
      where: { uploadId_algorithm: { uploadId: input.uploadId, algorithm: input.algorithm ?? "SHA256" } },
      update: {
        fileHash: input.fileHash,
        fingerprintHash: input.fingerprintHash ?? null,
        normalizedHash: input.normalizedHash ?? null,
      },
      create: input,
    });
  }

  async findFingerprintsByFileHash(fileHash: string) {
    return prisma.audioFingerprint.findMany({
      where: { fileHash },
      include: { track: { include: { release: true } }, organization: true },
    });
  }

  async createDuplicateMatch(input: Prisma.DuplicateAudioMatchUncheckedCreateInput, client: DatabaseClient = prisma) {
    return client.duplicateAudioMatch.upsert({
      where: {
        sourceFingerprintId_matchedFingerprintId: {
          sourceFingerprintId: input.sourceFingerprintId,
          matchedFingerprintId: input.matchedFingerprintId,
        },
      },
      update: {},
      create: input,
    });
  }

  async createReadinessScore(input: {
    organizationId: string;
    releaseId: string;
    inputHash: string;
    score: number;
    blockingCount: number;
    warningCount: number;
    explanation: Prisma.InputJsonValue;
    categories: Array<{ category: Prisma.ReleaseReadinessCategoryCreateInput["category"]; score: number; deductions: Prisma.InputJsonValue }>;
  }) {
    return prisma.releaseReadinessScore.create({
      data: {
        organizationId: input.organizationId,
        releaseId: input.releaseId,
        inputHash: input.inputHash,
        score: input.score,
        blockingCount: input.blockingCount,
        warningCount: input.warningCount,
        explanation: input.explanation,
        categories: {
          create: input.categories.map((category) => ({
            organizationId: input.organizationId,
            category: category.category,
            score: category.score,
            deductions: category.deductions,
          })),
        },
      },
      include: { categories: true },
    });
  }

  async latestReadinessScore(organizationId: string, releaseId: string) {
    return prisma.releaseReadinessScore.findFirst({
      where: { organizationId, releaseId },
      orderBy: { createdAt: "desc" },
      include: { categories: true },
    });
  }
}

export const intelligenceRepository = new IntelligenceRepository();
