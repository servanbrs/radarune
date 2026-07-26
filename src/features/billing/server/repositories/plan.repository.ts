import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";
import type {
  CreateSubscriptionPlanInput,
  UpsertPlanFeatureInput,
  UpsertPlanPriceInput,
} from "@/features/billing/schemas/billing.schema";

const planSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  active: true,
  isPublic: true,
  sortOrder: true,
  trialDays: true,
  createdAt: true,
  updatedAt: true,
  features: {
    select: {
      id: true,
      featureKey: true,
      valueType: true,
      booleanValue: true,
      integerValue: true,
      stringValue: true,
      jsonValue: true,
    },
    orderBy: {
      featureKey: "asc",
    },
  },
  prices: {
    select: {
      id: true,
      currencyCode: true,
      amountMinor: true,
      interval: true,
      intervalCount: true,
      provider: true,
      externalPriceId: true,
      active: true,
    },
    orderBy: [
      {
        provider: "asc",
      },
      {
        currencyCode: "asc",
      },
    ],
  },
} satisfies Prisma.SubscriptionPlanSelect;

export class PlanRepository {
  async listPublicPlans() {
    return prisma.subscriptionPlan.findMany({
      where: {
        active: true,
        isPublic: true,
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
      select: planSelect,
    });
  }

  async listAllPlans() {
    return prisma.subscriptionPlan.findMany({
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
      select: planSelect,
    });
  }

  async findPlanByCode(code: string, client: DatabaseClient = prisma) {
    return client.subscriptionPlan.findUnique({
      where: {
        code,
      },
      select: planSelect,
    });
  }

  async findPlanById(id: string, client: DatabaseClient = prisma) {
    return client.subscriptionPlan.findUnique({
      where: {
        id,
      },
      select: planSelect,
    });
  }

  async findPriceById(id: string, client: DatabaseClient = prisma) {
    return client.planPrice.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        planId: true,
        currencyCode: true,
        amountMinor: true,
        interval: true,
        intervalCount: true,
        provider: true,
        externalPriceId: true,
        active: true,
        plan: {
          select: {
            id: true,
            code: true,
            name: true,
            trialDays: true,
            active: true,
          },
        },
      },
    });
  }

  async upsertPlan(input: CreateSubscriptionPlanInput, client: DatabaseClient = prisma) {
    return client.subscriptionPlan.upsert({
      where: {
        code: input.code,
      },
      update: {
        name: input.name,
        description: input.description ?? null,
        active: input.active,
        isPublic: input.isPublic,
        sortOrder: input.sortOrder,
        trialDays: input.trialDays,
      },
      create: {
        code: input.code,
        name: input.name,
        description: input.description ?? null,
        active: input.active,
        isPublic: input.isPublic,
        sortOrder: input.sortOrder,
        trialDays: input.trialDays,
      },
      select: planSelect,
    });
  }

  async upsertPlanPrice(input: UpsertPlanPriceInput, client: DatabaseClient = prisma) {
    const existing = await client.planPrice.findFirst({
      where: {
        planId: input.planId,
        currencyCode: input.currencyCode,
        interval: input.interval,
        intervalCount: input.intervalCount,
        provider: input.provider,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return client.planPrice.update({
        where: {
          id: existing.id,
        },
        data: {
          amountMinor: input.amountMinor,
          externalPriceId: input.externalPriceId ?? null,
          active: input.active,
        },
        select: {
          id: true,
        },
      });
    }

    return client.planPrice.create({
      data: {
        planId: input.planId,
        currencyCode: input.currencyCode,
        amountMinor: input.amountMinor,
        interval: input.interval,
        intervalCount: input.intervalCount,
        provider: input.provider,
        externalPriceId: input.externalPriceId ?? null,
        active: input.active,
      },
      select: {
        id: true,
      },
    });
  }

  async upsertPlanFeature(input: UpsertPlanFeatureInput, client: DatabaseClient = prisma) {
    const valueData =
      input.booleanValue !== undefined
        ? {
            valueType: "BOOLEAN" as const,
            booleanValue: input.booleanValue,
            integerValue: null,
            stringValue: null,
            jsonValue: Prisma.JsonNull,
          }
        : input.integerValue !== undefined
          ? {
              valueType: "INTEGER" as const,
              booleanValue: null,
              integerValue: input.integerValue,
              stringValue: null,
              jsonValue: Prisma.JsonNull,
            }
          : input.stringValue !== undefined
            ? {
                valueType: "STRING" as const,
                booleanValue: null,
                integerValue: null,
                stringValue: input.stringValue,
                jsonValue: Prisma.JsonNull,
              }
            : {
                valueType: "JSON" as const,
                booleanValue: null,
                integerValue: null,
                stringValue: null,
                jsonValue: input.jsonValue
                  ? (input.jsonValue as Prisma.InputJsonValue)
                  : Prisma.JsonNull,
              };

    return client.planFeature.upsert({
      where: {
        planId_featureKey: {
          planId: input.planId,
          featureKey: input.featureKey,
        },
      },
      update: valueData,
      create: {
        planId: input.planId,
        featureKey: input.featureKey,
        ...valueData,
      },
      select: {
        id: true,
      },
    });
  }
}

export const planRepository = new PlanRepository();
