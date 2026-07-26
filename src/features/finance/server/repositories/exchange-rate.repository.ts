import "server-only";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

export class ExchangeRateRepository {
  async findLatestRate(params: {
    organizationId: string;
    effectiveDate: Date;
    baseCurrency: "TRY" | "USD" | "EUR";
    quoteCurrency: "TRY" | "USD" | "EUR";
  }) {
    return prisma.exchangeRate.findFirst({
      where: {
        OR: [
          {
            organizationId: params.organizationId,
          },
          {
            organizationId: null,
          },
        ],
        effectiveDate: {
          lte: params.effectiveDate,
        },
        baseCurrency: params.baseCurrency,
        quoteCurrency: params.quoteCurrency,
      },
      orderBy: [
        {
          organizationId: "desc",
        },
        {
          effectiveDate: "desc",
        },
      ],
      select: {
        id: true,
        rate: true,
      },
    });
  }

  async upsertRate(
    input: {
      organizationId?: string;
      effectiveDate: Date;
      baseCurrency: "TRY" | "USD" | "EUR";
      quoteCurrency: "TRY" | "USD" | "EUR";
      rate: string;
      source: string;
    },
    client: DatabaseClient = prisma,
  ) {
    if (input.organizationId) {
      return client.exchangeRate.upsert({
        where: {
          organizationId_effectiveDate_baseCurrency_quoteCurrency: {
            organizationId: input.organizationId,
            effectiveDate: input.effectiveDate,
            baseCurrency: input.baseCurrency,
            quoteCurrency: input.quoteCurrency,
          },
        },
        update: {
          rate: input.rate,
          source: input.source,
        },
        create: {
          organizationId: input.organizationId,
          effectiveDate: input.effectiveDate,
          baseCurrency: input.baseCurrency,
          quoteCurrency: input.quoteCurrency,
          rate: input.rate,
          source: input.source,
        },
        select: {
          id: true,
        },
      });
    }

    const existing = await client.exchangeRate.findFirst({
      where: {
        organizationId: null,
        effectiveDate: input.effectiveDate,
        baseCurrency: input.baseCurrency,
        quoteCurrency: input.quoteCurrency,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return client.exchangeRate.update({
        where: {
          id: existing.id,
        },
        data: {
          rate: input.rate,
          source: input.source,
        },
        select: {
          id: true,
        },
      });
    }

    return client.exchangeRate.create({
      data: {
        organizationId: null,
        effectiveDate: input.effectiveDate,
        baseCurrency: input.baseCurrency,
        quoteCurrency: input.quoteCurrency,
        rate: input.rate,
        source: input.source,
      },
      select: {
        id: true,
      },
    });
  }
}

export const exchangeRateRepository = new ExchangeRateRepository();
