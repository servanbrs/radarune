import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";
import type { BillingScopeInput } from "@/features/billing/schemas/billing.schema";

const subscriptionSummarySelect = {
  id: true,
  organizationId: true,
  userId: true,
  planId: true,
  priceId: true,
  billingCustomerId: true,
  scopeKey: true,
  activeScopeKey: true,
  provider: true,
  status: true,
  billingInterval: true,
  currencyCode: true,
  externalSubscriptionId: true,
  externalStatus: true,
  cancelAtPeriodEnd: true,
  startedAt: true,
  trialStartsAt: true,
  trialEndsAt: true,
  currentPeriodStartsAt: true,
  currentPeriodEndsAt: true,
  cancelAt: true,
  cancelledAt: true,
  endedAt: true,
  createdAt: true,
  updatedAt: true,
  plan: {
    select: {
      id: true,
      code: true,
      name: true,
      trialDays: true,
      features: {
        select: {
          featureKey: true,
          valueType: true,
          booleanValue: true,
          integerValue: true,
          stringValue: true,
          jsonValue: true,
        },
      },
    },
  },
  price: {
    select: {
      id: true,
      amountMinor: true,
      currencyCode: true,
      interval: true,
      intervalCount: true,
      provider: true,
      externalPriceId: true,
      active: true,
    },
  },
} satisfies Prisma.SubscriptionSelect;

function createScopeKey(scope: BillingScopeInput) {
  if (scope.organizationId) {
    return `org:${scope.organizationId}`;
  }

  if (scope.userId) {
    return `user:${scope.userId}`;
  }

  throw new Error("Subscription scope eksik.");
}

export class SubscriptionRepository {
  getScopeKey(scope: BillingScopeInput) {
    return createScopeKey(scope);
  }

  async findActiveByScope(scope: BillingScopeInput, client: DatabaseClient = prisma) {
    return client.subscription.findFirst({
      where: {
        scopeKey: createScopeKey(scope),
        status: {
          in: ["INCOMPLETE", "TRIALING", "ACTIVE", "PAST_DUE", "PAYMENT_FAILED", "PAUSED", "CANCEL_AT_PERIOD_END"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: subscriptionSummarySelect,
    });
  }

  async listByScope(scope: BillingScopeInput, client: DatabaseClient = prisma) {
    const where: Prisma.SubscriptionWhereInput = {};

    if (scope.organizationId) {
      where.organizationId = scope.organizationId;
    } else if (scope.userId) {
      where.userId = scope.userId;
    }

    return client.subscription.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      select: subscriptionSummarySelect,
    });
  }

  async findById(id: string, client: DatabaseClient = prisma) {
    return client.subscription.findUnique({
      where: {
        id,
      },
      select: subscriptionSummarySelect,
    });
  }

  async findByExternalSubscriptionId(provider: "STRIPE" | "IYZICO" | "PAYTR" | "MANUAL_BANK_TRANSFER", externalSubscriptionId: string, client: DatabaseClient = prisma) {
    return client.subscription.findUnique({
      where: {
        provider_externalSubscriptionId: {
          provider,
          externalSubscriptionId,
        },
      },
      select: subscriptionSummarySelect,
    });
  }

  async create(input: {
    scope: BillingScopeInput;
    planId: string;
    priceId?: string;
    billingCustomerId?: string;
    provider: "STRIPE" | "IYZICO" | "PAYTR" | "MANUAL_BANK_TRANSFER";
    status: "INCOMPLETE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "PAYMENT_FAILED" | "PAUSED" | "CANCEL_AT_PERIOD_END" | "CANCELLED" | "EXPIRED";
    billingInterval: "MONTHLY" | "YEARLY" | "CUSTOM";
    currencyCode: "TRY" | "USD" | "EUR";
    externalSubscriptionId?: string;
    externalStatus?: string;
    cancelAtPeriodEnd?: boolean;
    startedAt: Date;
    trialStartsAt?: Date;
    trialEndsAt?: Date;
    currentPeriodStartsAt?: Date;
    currentPeriodEndsAt?: Date;
    cancelAt?: Date;
    cancelledAt?: Date;
    endedAt?: Date;
  }, client: DatabaseClient = prisma) {
    const activeScopeKey =
      ["INCOMPLETE", "TRIALING", "ACTIVE", "PAST_DUE", "PAYMENT_FAILED", "PAUSED", "CANCEL_AT_PERIOD_END"].includes(
        input.status,
      )
        ? createScopeKey(input.scope)
        : null;

    return client.subscription.create({
      data: {
        organizationId: input.scope.organizationId ?? null,
        userId: input.scope.userId ?? null,
        planId: input.planId,
        priceId: input.priceId ?? null,
        billingCustomerId: input.billingCustomerId ?? null,
        scopeKey: createScopeKey(input.scope),
        activeScopeKey,
        provider: input.provider,
        status: input.status,
        billingInterval: input.billingInterval,
        currencyCode: input.currencyCode,
        externalSubscriptionId: input.externalSubscriptionId ?? null,
        externalStatus: input.externalStatus ?? null,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
        startedAt: input.startedAt,
        trialStartsAt: input.trialStartsAt ?? null,
        trialEndsAt: input.trialEndsAt ?? null,
        currentPeriodStartsAt: input.currentPeriodStartsAt ?? null,
        currentPeriodEndsAt: input.currentPeriodEndsAt ?? null,
        cancelAt: input.cancelAt ?? null,
        cancelledAt: input.cancelledAt ?? null,
        endedAt: input.endedAt ?? null,
      },
      select: subscriptionSummarySelect,
    });
  }

  async updateLifecycle(
    id: string,
    input: {
      status: "INCOMPLETE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "PAYMENT_FAILED" | "PAUSED" | "CANCEL_AT_PERIOD_END" | "CANCELLED" | "EXPIRED";
      externalStatus?: string | null;
      externalSubscriptionId?: string | null;
      cancelAtPeriodEnd?: boolean;
      currentPeriodStartsAt?: Date | null;
      currentPeriodEndsAt?: Date | null;
      cancelAt?: Date | null;
      cancelledAt?: Date | null;
      endedAt?: Date | null;
    },
    client: DatabaseClient = prisma,
  ) {
    const current = await client.subscription.findUniqueOrThrow({
      where: {
        id,
      },
      select: {
        scopeKey: true,
      },
    });

    const activeScopeKey =
      ["INCOMPLETE", "TRIALING", "ACTIVE", "PAST_DUE", "PAYMENT_FAILED", "PAUSED", "CANCEL_AT_PERIOD_END"].includes(
        input.status,
      )
        ? current.scopeKey
        : null;

    return client.subscription.update({
      where: {
        id,
      },
      data: {
        status: input.status,
        activeScopeKey,
        ...(input.externalStatus !== undefined ? { externalStatus: input.externalStatus } : {}),
        ...(input.externalSubscriptionId !== undefined
          ? { externalSubscriptionId: input.externalSubscriptionId }
          : {}),
        ...(input.cancelAtPeriodEnd !== undefined
          ? { cancelAtPeriodEnd: input.cancelAtPeriodEnd }
          : {}),
        ...(input.currentPeriodStartsAt !== undefined
          ? { currentPeriodStartsAt: input.currentPeriodStartsAt }
          : {}),
        ...(input.currentPeriodEndsAt !== undefined
          ? { currentPeriodEndsAt: input.currentPeriodEndsAt }
          : {}),
        ...(input.cancelAt !== undefined ? { cancelAt: input.cancelAt } : {}),
        ...(input.cancelledAt !== undefined ? { cancelledAt: input.cancelledAt } : {}),
        ...(input.endedAt !== undefined ? { endedAt: input.endedAt } : {}),
      },
      select: subscriptionSummarySelect,
    });
  }

  async upsertUsage(input: {
    subscriptionId: string;
    featureKey: string;
    usageCount: bigint;
    periodStart: Date;
    periodEnd: Date;
  }, client: DatabaseClient = prisma) {
    return client.subscriptionUsage.upsert({
      where: {
        subscriptionId_featureKey_periodStart_periodEnd: {
          subscriptionId: input.subscriptionId,
          featureKey: input.featureKey,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
        },
      },
      update: {
        usageCount: input.usageCount,
      },
      create: input,
      select: {
        id: true,
      },
    });
  }
}

export const subscriptionRepository = new SubscriptionRepository();
