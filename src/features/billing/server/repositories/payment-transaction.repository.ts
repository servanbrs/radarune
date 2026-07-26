import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";
import type {
  BillingScopeInput,
  PaymentTransactionFilterInput,
} from "@/features/billing/schemas/billing.schema";

export class PaymentTransactionRepository {
  async listByScope(
    scope: BillingScopeInput,
    filters: PaymentTransactionFilterInput,
    client: DatabaseClient = prisma,
  ) {
    const where: Prisma.PaymentTransactionWhereInput = {};

    if (scope.organizationId) {
      where.organizationId = scope.organizationId;
    } else if (scope.userId) {
      where.userId = scope.userId;
    }

    if (filters.provider) {
      where.provider = filters.provider;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return client.paymentTransaction.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        provider: true,
        status: true,
        currencyCode: true,
        amountMinor: true,
        authorizedAmountMinor: true,
        capturedAmountMinor: true,
        refundedAmountMinor: true,
        externalPaymentId: true,
        externalCheckoutId: true,
        createdAt: true,
        paidAt: true,
        failedAt: true,
      },
    });
  }

  async findById(id: string, client: DatabaseClient = prisma) {
    return client.paymentTransaction.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        organizationId: true,
        userId: true,
        subscriptionId: true,
        billingCustomerId: true,
        invoiceId: true,
        provider: true,
        status: true,
        currencyCode: true,
        amountMinor: true,
        authorizedAmountMinor: true,
        capturedAmountMinor: true,
        refundedAmountMinor: true,
        externalPaymentId: true,
        externalCheckoutId: true,
        externalInvoiceId: true,
        externalSubscriptionId: true,
      },
    });
  }

  async findByIdempotencyKey(idempotencyKey: string, client: DatabaseClient = prisma) {
    return client.paymentTransaction.findUnique({
      where: {
        idempotencyKey,
      },
      select: {
        id: true,
      },
    });
  }

  async create(input: {
    scope: BillingScopeInput;
    subscriptionId?: string;
    billingCustomerId?: string;
    invoiceId?: string;
    provider: "STRIPE" | "IYZICO" | "PAYTR" | "MANUAL_BANK_TRANSFER";
    status: "REQUIRES_ACTION" | "PENDING" | "AUTHORIZED" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "REFUNDED" | "PARTIALLY_REFUNDED";
    currencyCode: "TRY" | "USD" | "EUR";
    amountMinor: bigint;
    externalPaymentId?: string;
    externalCheckoutId?: string;
    externalInvoiceId?: string;
    externalSubscriptionId?: string;
    description?: string;
    idempotencyKey: string;
  }, client: DatabaseClient = prisma) {
    return client.paymentTransaction.create({
      data: {
        organizationId: input.scope.organizationId ?? null,
        userId: input.scope.userId ?? null,
        subscriptionId: input.subscriptionId ?? null,
        billingCustomerId: input.billingCustomerId ?? null,
        invoiceId: input.invoiceId ?? null,
        provider: input.provider,
        status: input.status,
        currencyCode: input.currencyCode,
        amountMinor: input.amountMinor,
        externalPaymentId: input.externalPaymentId ?? null,
        externalCheckoutId: input.externalCheckoutId ?? null,
        externalInvoiceId: input.externalInvoiceId ?? null,
        externalSubscriptionId: input.externalSubscriptionId ?? null,
        description: input.description ?? null,
        idempotencyKey: input.idempotencyKey,
      },
      select: {
        id: true,
      },
    });
  }

  async updateStatus(
    id: string,
    input: {
      status: "REQUIRES_ACTION" | "PENDING" | "AUTHORIZED" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "REFUNDED" | "PARTIALLY_REFUNDED";
      externalPaymentId?: string | null;
      authorizedAmountMinor?: bigint;
      capturedAmountMinor?: bigint;
      refundedAmountMinor?: bigint;
      paidAt?: Date | null;
      failedAt?: Date | null;
      cancelledAt?: Date | null;
    },
    client: DatabaseClient = prisma,
  ) {
    return client.paymentTransaction.update({
      where: {
        id,
      },
      data: {
        status: input.status,
        ...(input.externalPaymentId !== undefined
          ? { externalPaymentId: input.externalPaymentId }
          : {}),
        ...(input.authorizedAmountMinor !== undefined
          ? { authorizedAmountMinor: input.authorizedAmountMinor }
          : {}),
        ...(input.capturedAmountMinor !== undefined
          ? { capturedAmountMinor: input.capturedAmountMinor }
          : {}),
        ...(input.refundedAmountMinor !== undefined
          ? { refundedAmountMinor: input.refundedAmountMinor }
          : {}),
        ...(input.paidAt !== undefined ? { paidAt: input.paidAt } : {}),
        ...(input.failedAt !== undefined ? { failedAt: input.failedAt } : {}),
        ...(input.cancelledAt !== undefined ? { cancelledAt: input.cancelledAt } : {}),
      },
      select: {
        id: true,
      },
    });
  }
}

export const paymentTransactionRepository = new PaymentTransactionRepository();
