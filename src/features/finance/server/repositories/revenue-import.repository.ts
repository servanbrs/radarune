import "server-only";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

type CreateRevenueImportInput = {
  organizationId: string;
  importedByUserId: string;
  fileName: string;
  sourceMimeType: string;
  sourceFileSha256: string;
  periodStart: Date;
  periodEnd: Date;
  reportingCurrency: "TRY" | "USD" | "EUR";
  rowCount: number;
};

type CreateStoreRevenueInput = {
  revenueImportId: string;
  organizationId: string;
  labelId?: string;
  artistId?: string;
  reportDate: Date;
  storeName: string;
  platformName: string;
  countryCode: string;
  currencyCode: "TRY" | "USD" | "EUR";
  exchangeRate: string;
  releaseTitle: string;
  trackTitle: string;
  trackKey: string;
  isrc?: string;
  upc?: string;
  streamCount: number;
  downloadCount: number;
  playlistAppearances: number;
  grossRevenueMinor: bigint;
  platformFeeMinor: bigint;
  netRevenueMinor: bigint;
  externalTransactionId: string;
  dedupeKey: string;
};

type CreatePlatformRevenueInput = {
  revenueImportId: string;
  organizationId: string;
  reportDate: Date;
  platformName: string;
  storeName: string;
  currencyCode: "TRY" | "USD" | "EUR";
  totalStreams: number;
  totalDownloads: number;
  grossRevenueMinor: bigint;
  netRevenueMinor: bigint;
};

export class RevenueImportRepository {
  async findDuplicateImport(organizationId: string, sourceFileSha256: string) {
    return prisma.revenueImport.findUnique({
      where: {
        organizationId_sourceFileSha256: {
          organizationId,
          sourceFileSha256,
        },
      },
      select: {
        id: true,
      },
    });
  }

  async findDuplicateTransactions(dedupeKeys: string[]) {
    if (dedupeKeys.length === 0) {
      return [];
    }

    return prisma.storeRevenue.findMany({
      where: {
        dedupeKey: {
          in: dedupeKeys,
        },
      },
      select: {
        dedupeKey: true,
      },
    });
  }

  async createImport(input: CreateRevenueImportInput, client: DatabaseClient = prisma) {
    return client.revenueImport.create({
      data: {
        organizationId: input.organizationId,
        importedByUserId: input.importedByUserId,
        fileName: input.fileName,
        sourceMimeType: input.sourceMimeType,
        sourceFileSha256: input.sourceFileSha256,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        reportingCurrency: input.reportingCurrency,
        status: "PROCESSING",
        rowCount: input.rowCount,
        importedRowCount: 0,
        rejectedRowCount: 0,
      },
      select: {
        id: true,
      },
    });
  }

  async createStoreRevenues(
    rows: CreateStoreRevenueInput[],
    client: DatabaseClient = prisma,
  ) {
    if (rows.length === 0) {
      return;
    }

    await client.storeRevenue.createMany({
      data: rows.map((row) => ({
        revenueImportId: row.revenueImportId,
        organizationId: row.organizationId,
        labelId: row.labelId ?? null,
        artistId: row.artistId ?? null,
        reportDate: row.reportDate,
        storeName: row.storeName,
        platformName: row.platformName,
        countryCode: row.countryCode,
        currencyCode: row.currencyCode,
        exchangeRate: row.exchangeRate,
        releaseTitle: row.releaseTitle,
        trackTitle: row.trackTitle,
        trackKey: row.trackKey,
        isrc: row.isrc ?? null,
        upc: row.upc ?? null,
        streamCount: row.streamCount,
        downloadCount: row.downloadCount,
        playlistAppearances: row.playlistAppearances,
        grossRevenueMinor: row.grossRevenueMinor,
        platformFeeMinor: row.platformFeeMinor,
        netRevenueMinor: row.netRevenueMinor,
        externalTransactionId: row.externalTransactionId,
        dedupeKey: row.dedupeKey,
      })),
    });
  }

  async createPlatformRevenues(
    rows: CreatePlatformRevenueInput[],
    client: DatabaseClient = prisma,
  ) {
    if (rows.length === 0) {
      return;
    }

    await client.platformRevenue.createMany({
      data: rows,
    });
  }

  async completeImport(params: {
    importId: string;
    importedRowCount: number;
    rejectedRowCount: number;
  }, client: DatabaseClient = prisma) {
    return client.revenueImport.update({
      where: {
        id: params.importId,
      },
      data: {
        status: "COMPLETED",
        importedRowCount: params.importedRowCount,
        rejectedRowCount: params.rejectedRowCount,
        completedAt: new Date(),
      },
      select: {
        id: true,
      },
    });
  }

  async failImport(params: {
    importId: string;
    failureReason: string;
  }, client: DatabaseClient = prisma) {
    return client.revenueImport.update({
      where: {
        id: params.importId,
      },
      data: {
        status: "FAILED",
        failureReason: params.failureReason,
      },
      select: {
        id: true,
      },
    });
  }

  async listImportsByOrganization(organizationId: string, limit = 20) {
    return prisma.revenueImport.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        fileName: true,
        reportingCurrency: true,
        status: true,
        rowCount: true,
        importedRowCount: true,
        rejectedRowCount: true,
        periodStart: true,
        periodEnd: true,
        failureReason: true,
        createdAt: true,
        completedAt: true,
      },
    });
  }

  async hasCompletedImportsForPeriod(params: {
    organizationId: string;
    periodStart: Date;
    periodEnd: Date;
  }) {
    const count = await prisma.revenueImport.count({
      where: {
        organizationId: params.organizationId,
        status: "COMPLETED",
        periodStart: {
          gte: params.periodStart,
        },
        periodEnd: {
          lte: params.periodEnd,
        },
      },
    });

    return count > 0;
  }

  async listStoreRevenueRowsForPeriod(params: {
    organizationId: string;
    periodStart: Date;
    periodEnd: Date;
  }) {
    return prisma.storeRevenue.findMany({
      where: {
        organizationId: params.organizationId,
        reportDate: {
          gte: params.periodStart,
          lte: params.periodEnd,
        },
      },
      orderBy: [
        {
          reportDate: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
      select: {
        id: true,
        organizationId: true,
        labelId: true,
        artistId: true,
        reportDate: true,
        storeName: true,
        platformName: true,
        countryCode: true,
        currencyCode: true,
        exchangeRate: true,
        releaseTitle: true,
        trackTitle: true,
        trackKey: true,
        isrc: true,
        upc: true,
        streamCount: true,
        downloadCount: true,
        grossRevenueMinor: true,
        platformFeeMinor: true,
        netRevenueMinor: true,
        revenueImport: {
          select: {
            reportingCurrency: true,
          },
        },
        artist: {
          select: {
            id: true,
            name: true,
            ownerUserId: true,
          },
        },
        label: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}

export const revenueImportRepository = new RevenueImportRepository();
