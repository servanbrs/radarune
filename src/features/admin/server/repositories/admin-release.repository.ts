import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import type { DatabaseClient } from "@/server/prisma/database-client";

export class AdminReleaseRepository {
  async list(params: { organizationId: string; page: number; pageSize: number; search?: string; status?: Prisma.ReleaseWhereInput["status"] }) {
    const where: Prisma.ReleaseWhereInput = {
      organizationId: params.organizationId,
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search } },
              { upc: { contains: params.search } },
              { artists: { some: { artist: { name: { contains: params.search } } } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.release.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          label: { select: { id: true, name: true } },
          artists: {
            include: { artist: { select: { id: true, name: true } } },
            orderBy: { sortOrder: "asc" },
          },
          tracks: { select: { id: true } },
          validationIssues: {
            where: { resolvedAt: null },
            select: { id: true, severity: true },
          },
          distributionSelection: true,
        },
      }),
      prisma.release.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, client: DatabaseClient = prisma) {
    return client.release.findUnique({
      where: { id },
      include: {
        organization: true,
        createdByUser: { select: { id: true, name: true, email: true } },
        submittedByUser: { select: { id: true, name: true, email: true } },
        label: true,
        artists: { include: { artist: true }, orderBy: { sortOrder: "asc" } },
        contributors: true,
        tracks: {
          orderBy: [{ discNumber: "asc" }, { trackNumber: "asc" }],
          include: {
            artists: { include: { artist: true }, orderBy: { sortOrder: "asc" } },
            contributors: { include: { contributor: true } },
            uploads: true,
            validationIssues: { where: { resolvedAt: null } },
          },
        },
        stores: true,
        territories: true,
        uploads: true,
        validationIssues: { where: { resolvedAt: null }, orderBy: { createdAt: "desc" } },
        statusHistory: { orderBy: { createdAt: "desc" }, take: 30 },
      },
    });
  }

  // The moderation screen only needs a small, stable projection. Keeping this
  // separate from the action query prevents optional/legacy relations from
  // taking down the whole admin detail page when a production schema is behind.
  async findDetailById(id: string, client: DatabaseClient = prisma) {
    return client.release.findUnique({
      where: { id },
      select: {
        id: true,
        organizationId: true,
        title: true,
        type: true,
        status: true,
        upc: true,
        distributionProvider: true,
        artworkUploadId: true,
        createdByUser: { select: { id: true, name: true, email: true } },
        label: { select: { id: true, name: true } },
        uploads: { select: { id: true, fileName: true, mimeType: true, kind: true } },
        tracks: {
          orderBy: [{ discNumber: "asc" }, { trackNumber: "asc" }],
          select: {
            id: true,
            title: true,
            discNumber: true,
            trackNumber: true,
            isrc: true,
            audioUploadId: true,
            uploads: { select: { id: true, fileName: true, mimeType: true } },
          },
        },
        validationIssues: {
          where: { resolvedAt: null },
          orderBy: { createdAt: "desc" },
          select: { id: true, severity: true, fieldPath: true, message: true },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          take: 30,
          select: { id: true, previousStatus: true, status: true, reason: true, createdAt: true },
        },
      },
    });
  }

  async createRevisionIssues(
    input: {
      organizationId: string;
      releaseId: string;
      issues: Array<{
        fieldPath: string;
        step: string;
        code: string;
        message: string;
        severity: "INFO" | "WARNING" | "ERROR";
      }>;
    },
    client: DatabaseClient,
  ) {
    if (input.issues.length === 0) {
      return;
    }

    await client.releaseValidationIssue.createMany({
      data: input.issues.map((issue) => ({
        organizationId: input.organizationId,
        releaseId: input.releaseId,
        fieldPath: issue.fieldPath,
        step: issue.step,
        code: issue.code,
        message: issue.message,
        severity: issue.severity,
      })),
    });
  }
}

export const adminReleaseRepository = new AdminReleaseRepository();
