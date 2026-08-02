import "server-only";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

export class PayoutRepository {
  async listMethodsByOrganization(organizationId: string) {
    return prisma.payoutMethod.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: [
        {
          isDefault: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      select: {
        id: true,
        artistId: true,
        labelId: true,
        type: true,
        accountHolderName: true,
        bankName: true,
        iban: true,
        payoneerEmail: true,
        wiseRecipientId: true,
        stripeConnectAccountId: true,
        isDefault: true,
        isActive: true,
      },
    });
  }

  async createMethod(
    input: {
      organizationId: string;
      userId: string;
      artistId?: string;
      labelId?: string;
      type: "PAYONEER" | "WISE" | "IBAN" | "STRIPE_CONNECT";
      accountHolderName: string;
      bankName?: string;
      iban?: string;
      payoneerEmail?: string;
      wiseRecipientId?: string;
      stripeConnectAccountId?: string;
    },
    client: DatabaseClient = prisma,
  ) {
    return client.payoutMethod.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        artistId: input.artistId ?? null,
        labelId: input.labelId ?? null,
        type: input.type,
        accountHolderName: input.accountHolderName,
        bankName: input.bankName ?? null,
        iban: input.iban ?? null,
        payoneerEmail: input.payoneerEmail ?? null,
        wiseRecipientId: input.wiseRecipientId ?? null,
        stripeConnectAccountId: input.stripeConnectAccountId ?? null,
      },
      select: {
        id: true,
      },
    });
  }

  async findMethodById(methodId: string, organizationId: string) {
    return prisma.payoutMethod.findFirst({
      where: {
        id: methodId,
        organizationId,
      },
      select: {
        id: true,
        organizationId: true,
        userId: true,
        artistId: true,
        labelId: true,
        type: true,
        accountHolderName: true,
        bankName: true,
        iban: true,
        payoneerEmail: true,
        wiseRecipientId: true,
        stripeConnectAccountId: true,
        isActive: true,
      },
    });
  }

  async findDuplicateOpenPayout(
    statementId: string,
    organizationId: string,
    client: DatabaseClient = prisma,
  ) {
    return client.payout.findFirst({
      where: {
        statementId,
        organizationId,
        status: {
          in: ["PENDING", "APPROVED", "PROCESSING", "PAID"],
        },
      },
      select: {
        id: true,
      },
    });
  }

  async createPayout(
    input: {
      organizationId: string;
      requestedByUserId: string;
      statementId: string;
      payoutMethodId: string;
      subjectType: "ARTIST" | "LABEL";
      beneficiaryUserId?: string;
      artistId?: string;
      labelId?: string;
      amountMinor: bigint;
      currencyCode: "TRY" | "USD" | "EUR";
      idempotencyKey: string;
    },
    client: DatabaseClient = prisma,
  ) {
    return client.payout.create({
      data: {
        organizationId: input.organizationId,
        requestedByUserId: input.requestedByUserId,
        statementId: input.statementId,
        payoutMethodId: input.payoutMethodId,
        subjectType: input.subjectType,
        beneficiaryUserId: input.beneficiaryUserId ?? null,
        artistId: input.artistId ?? null,
        labelId: input.labelId ?? null,
        amountMinor: input.amountMinor,
        currencyCode: input.currencyCode,
        status: "PENDING",
        idempotencyKey: input.idempotencyKey,
      },
      select: {
        id: true,
      },
    });
  }

  async findPayoutById(payoutId: string) {
    return prisma.payout.findUnique({
      where: {
        id: payoutId,
      },
      select: {
        id: true,
        organizationId: true,
        status: true,
        amountMinor: true,
        currencyCode: true,
        statementId: true,
        requestedByUserId: true,
        beneficiaryUserId: true,
        artistId: true,
        labelId: true,
      },
    });
  }

  async approvePayout(
    payoutId: string,
    approvedByUserId: string,
    client: DatabaseClient = prisma,
  ) {
    const result = await client.payout.updateMany({
      where: {
        id: payoutId,
        status: "PENDING",
      },
      data: {
        status: "APPROVED",
        approvedByUserId,
        approvedAt: new Date(),
      },
    });

    if (result.count !== 1) {
      throw new Error("Payout artık PENDING durumda değil.");
    }

    return { id: payoutId };
  }

  async cancelPayout(
    payoutId: string,
    failureReason: string,
    client: DatabaseClient = prisma,
  ) {
    const result = await client.payout.updateMany({
      where: {
        id: payoutId,
        status: { notIn: ["PAID", "CANCELLED"] },
      },
      data: {
        status: "CANCELLED",
        failureReason,
        cancelledAt: new Date(),
      },
    });

    if (result.count !== 1) {
      throw new Error("Payout artık iptal edilebilir durumda değil.");
    }

    return { id: payoutId };
  }

  async listPayoutsByOrganization(organizationId: string) {
    return prisma.payout.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        requestedAt: "desc",
      },
      select: {
        id: true,
        status: true,
        amountMinor: true,
        currencyCode: true,
        requestedAt: true,
        approvedAt: true,
        paidAt: true,
        failureReason: true,
        payoutMethod: {
        select: {
          id: true,
          type: true,
          accountHolderName: true,
          artistId: true,
          labelId: true,
        },
        },
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

  async sumPaidWithdrawalsForSubjectInPeriod(params: {
    organizationId: string;
    subjectType: "ARTIST" | "LABEL";
    beneficiaryUserId?: string;
    artistId?: string;
    labelId?: string;
    periodStart: Date;
    periodEnd: Date;
  }) {
    const result = await prisma.payout.aggregate({
      where: {
        organizationId: params.organizationId,
        subjectType: params.subjectType,
        beneficiaryUserId: params.beneficiaryUserId ?? null,
        artistId: params.artistId ?? null,
        labelId: params.labelId ?? null,
        status: "PAID",
        paidAt: {
          gte: params.periodStart,
          lte: params.periodEnd,
        },
      },
      _sum: {
        amountMinor: true,
      },
    });

    return result._sum.amountMinor ?? 0n;
  }
}

export const payoutRepository = new PayoutRepository();
