import "server-only";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

export class RoyaltyRepository {
  async listSplitsByTrackKeys(organizationId: string, trackKeys: string[]) {
    if (trackKeys.length === 0) {
      return [];
    }

    return prisma.royaltySplit.findMany({
      where: {
        organizationId,
        trackKey: {
          in: trackKeys,
        },
      },
      orderBy: [
        {
          trackKey: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
      select: {
        id: true,
        trackKey: true,
        trackTitle: true,
        releaseTitle: true,
        role: true,
        participantName: true,
        percentageBps: true,
        beneficiaryUserId: true,
        artistId: true,
        labelId: true,
      },
    });
  }

  async createSplit(
    input: {
      organizationId: string;
      beneficiaryUserId?: string;
      artistId?: string;
      labelId?: string;
      trackKey: string;
      trackTitle: string;
      releaseTitle?: string;
      role: "LABEL" | "ARTIST" | "PRODUCER" | "COMPOSER" | "LYRICIST" | "MANAGER";
      participantName: string;
      percentageBps: number;
    },
    client: DatabaseClient = prisma,
  ) {
    return client.royaltySplit.create({
      data: {
        organizationId: input.organizationId,
        beneficiaryUserId: input.beneficiaryUserId ?? null,
        artistId: input.artistId ?? null,
        labelId: input.labelId ?? null,
        trackKey: input.trackKey,
        trackTitle: input.trackTitle,
        releaseTitle: input.releaseTitle ?? null,
        role: input.role,
        participantName: input.participantName,
        percentageBps: input.percentageBps,
      },
      select: {
        id: true,
      },
    });
  }

  async findExistingReport(params: {
    organizationId: string;
    periodStart: Date;
    periodEnd: Date;
    reportingCurrency: "TRY" | "USD" | "EUR";
  }) {
    return prisma.royaltyReport.findFirst({
      where: {
        organizationId: params.organizationId,
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        reportingCurrency: params.reportingCurrency,
      },
      select: {
        id: true,
      },
    });
  }

  async createRevenueReport(
    input: {
      organizationId: string;
      generatedByUserId: string;
      periodStart: Date;
      periodEnd: Date;
      reportingCurrency: "TRY" | "USD" | "EUR";
      totalStreams: number;
      totalDownloads: number;
      grossRevenueMinor: bigint;
      platformFeeMinor: bigint;
      netRevenueMinor: bigint;
    },
    client: DatabaseClient = prisma,
  ) {
    return client.revenueReport.upsert({
      where: {
        organizationId_periodStart_periodEnd_reportingCurrency: {
          organizationId: input.organizationId,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          reportingCurrency: input.reportingCurrency,
        },
      },
      update: {
        generatedByUserId: input.generatedByUserId,
        totalStreams: input.totalStreams,
        totalDownloads: input.totalDownloads,
        grossRevenueMinor: input.grossRevenueMinor,
        platformFeeMinor: input.platformFeeMinor,
        netRevenueMinor: input.netRevenueMinor,
      },
      create: input,
      select: {
        id: true,
      },
    });
  }

  async createRoyaltyReport(
    input: {
      organizationId: string;
      generatedByUserId: string;
      periodStart: Date;
      periodEnd: Date;
      reportingCurrency: "TRY" | "USD" | "EUR";
      grossRevenueMinor: bigint;
      platformFeeMinor: bigint;
      commissionMinor: bigint;
      netRevenueMinor: bigint;
    },
    client: DatabaseClient = prisma,
  ) {
    return client.royaltyReport.create({
      data: {
        organizationId: input.organizationId,
        generatedByUserId: input.generatedByUserId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        reportingCurrency: input.reportingCurrency,
        status: "FINALIZED",
        grossRevenueMinor: input.grossRevenueMinor,
        platformFeeMinor: input.platformFeeMinor,
        commissionMinor: input.commissionMinor,
        netRevenueMinor: input.netRevenueMinor,
        immutableAt: new Date(),
      },
      select: {
        id: true,
      },
    });
  }

  async createRoyaltyLines(
    lines: Array<{
      royaltyReportId: string;
      organizationId: string;
      subjectType: "ARTIST" | "LABEL";
      beneficiaryUserId?: string;
      artistId?: string;
      labelId?: string;
      sourceStoreRevenueId?: string;
      participantName: string;
      splitRole: "LABEL" | "ARTIST" | "PRODUCER" | "COMPOSER" | "LYRICIST" | "MANAGER";
      platformName: string;
      storeName: string;
      countryCode: string;
      currencyCode: "TRY" | "USD" | "EUR";
      trackKey: string;
      trackTitle: string;
      releaseTitle: string;
      grossRevenueMinor: bigint;
      platformFeeMinor: bigint;
      commissionMinor: bigint;
      distributableMinor: bigint;
      beneficiaryAmountMinor: bigint;
      shareBps: number;
    }>,
    client: DatabaseClient = prisma,
  ) {
    if (lines.length === 0) {
      return;
    }

    await client.royaltyLine.createMany({
      data: lines.map((line) => ({
        ...line,
        beneficiaryUserId: line.beneficiaryUserId ?? null,
        artistId: line.artistId ?? null,
        labelId: line.labelId ?? null,
        sourceStoreRevenueId: line.sourceStoreRevenueId ?? null,
      })),
    });
  }

  async listReportsByOrganization(organizationId: string) {
    return prisma.royaltyReport.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        reportingCurrency: true,
        grossRevenueMinor: true,
        platformFeeMinor: true,
        commissionMinor: true,
        netRevenueMinor: true,
        createdAt: true,
      },
    });
  }

  async getReportWithLines(reportId: string, organizationId: string) {
    return prisma.royaltyReport.findFirst({
      where: {
        id: reportId,
        organizationId,
      },
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        reportingCurrency: true,
        grossRevenueMinor: true,
        platformFeeMinor: true,
        commissionMinor: true,
        netRevenueMinor: true,
        lines: {
          orderBy: [
            {
              beneficiaryAmountMinor: "desc",
            },
          ],
          select: {
            id: true,
            beneficiaryUserId: true,
            artistId: true,
            participantName: true,
            splitRole: true,
            platformName: true,
            storeName: true,
            countryCode: true,
            trackTitle: true,
            releaseTitle: true,
            beneficiaryAmountMinor: true,
            shareBps: true,
            artist: {
              select: {
                id: true,
                name: true,
              },
            },
            label: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }
}

export const royaltyRepository = new RoyaltyRepository();
