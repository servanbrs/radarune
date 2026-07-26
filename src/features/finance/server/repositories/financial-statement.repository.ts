import "server-only";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

export class FinancialStatementRepository {
  async findLatestStatementBeforePeriod(params: {
    organizationId: string;
    subjectType: "ARTIST" | "LABEL";
    beneficiaryUserId?: string;
    artistId?: string;
    labelId?: string;
    periodStart: Date;
  }) {
    return prisma.financialStatement.findFirst({
      where: {
        organizationId: params.organizationId,
        subjectType: params.subjectType,
        beneficiaryUserId: params.beneficiaryUserId ?? null,
        artistId: params.artistId ?? null,
        labelId: params.labelId ?? null,
        periodEnd: {
          lt: params.periodStart,
        },
      },
      orderBy: {
        periodEnd: "desc",
      },
      select: {
        id: true,
        closingBalanceMinor: true,
      },
    });
  }

  async createManyStatements(
    statements: Array<{
      organizationId: string;
      royaltyReportId: string;
      subjectType: "ARTIST" | "LABEL";
      beneficiaryUserId?: string;
      artistId?: string;
      labelId?: string;
      periodStart: Date;
      periodEnd: Date;
      currencyCode: "TRY" | "USD" | "EUR";
      openingBalanceMinor: bigint;
      totalRevenueMinor: bigint;
      adjustmentsMinor: bigint;
      withdrawalsMinor: bigint;
      closingBalanceMinor: bigint;
    }>,
    client: DatabaseClient = prisma,
  ) {
    if (statements.length === 0) {
      return;
    }

    await client.financialStatement.createMany({
      data: statements.map((statement) => ({
        ...statement,
        beneficiaryUserId: statement.beneficiaryUserId ?? null,
        artistId: statement.artistId ?? null,
        labelId: statement.labelId ?? null,
        status: "OPEN",
      })),
    });
  }

  async listStatementsByOrganization(organizationId: string) {
    return prisma.financialStatement.findMany({
      where: {
        organizationId,
      },
      orderBy: [
        {
          periodEnd: "desc",
        },
      ],
      select: {
        id: true,
        subjectType: true,
        beneficiaryUserId: true,
        artistId: true,
        currencyCode: true,
        openingBalanceMinor: true,
        totalRevenueMinor: true,
        adjustmentsMinor: true,
        withdrawalsMinor: true,
        closingBalanceMinor: true,
        periodStart: true,
        periodEnd: true,
        beneficiaryUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
    });
  }

  async getStatementById(statementId: string) {
    return prisma.financialStatement.findUnique({
      where: {
        id: statementId,
      },
      select: {
        id: true,
        organizationId: true,
        subjectType: true,
        currencyCode: true,
        openingBalanceMinor: true,
        totalRevenueMinor: true,
        adjustmentsMinor: true,
        withdrawalsMinor: true,
        closingBalanceMinor: true,
        periodStart: true,
        periodEnd: true,
        beneficiaryUserId: true,
        artistId: true,
        labelId: true,
        beneficiaryUser: {
          select: {
            id: true,
            name: true,
            email: true,
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

  async sumAdjustmentsForSubjectInPeriod(params: {
    organizationId: string;
    subjectType: "ARTIST" | "LABEL";
    beneficiaryUserId?: string;
    artistId?: string;
    labelId?: string;
    periodStart: Date;
    periodEnd: Date;
  }) {
    const adjustments = await prisma.financialAdjustment.findMany({
      where: {
        organizationId: params.organizationId,
        subjectType: params.subjectType,
        beneficiaryUserId: params.beneficiaryUserId ?? null,
        artistId: params.artistId ?? null,
        labelId: params.labelId ?? null,
        createdAt: {
          gte: params.periodStart,
          lte: params.periodEnd,
        },
      },
      select: {
        amountMinor: true,
        direction: true,
      },
    });

    return adjustments.reduce((total, adjustment) => {
      return adjustment.direction === "CREDIT"
        ? total + adjustment.amountMinor
        : total - adjustment.amountMinor;
    }, 0n);
  }
}

export const financialStatementRepository = new FinancialStatementRepository();
