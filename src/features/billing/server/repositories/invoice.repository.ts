import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";
import type { BillingScopeInput, InvoiceFilterInput } from "@/features/billing/schemas/billing.schema";

export class InvoiceRepository {
  async listByScope(
    scope: BillingScopeInput,
    filters: InvoiceFilterInput,
    client: DatabaseClient = prisma,
  ) {
    const where: Prisma.InvoiceWhereInput = {};

    if (scope.organizationId) {
      where.organizationId = scope.organizationId;
    } else if (scope.userId) {
      where.userId = scope.userId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return client.invoice.findMany({
      where,
      orderBy: {
        issuedAt: "desc",
      },
      select: {
        id: true,
        provider: true,
        status: true,
        currencyCode: true,
        invoiceNumber: true,
        subtotalMinor: true,
        discountMinor: true,
        taxMinor: true,
        totalMinor: true,
        amountDueMinor: true,
        amountPaidMinor: true,
        hostedInvoiceUrl: true,
        issuedAt: true,
        dueAt: true,
        paidAt: true,
        lines: {
          select: {
            id: true,
            description: true,
            quantity: true,
            totalMinor: true,
          },
        },
      },
    });
  }

  async create(input: {
    scope: BillingScopeInput;
    subscriptionId?: string;
    billingCustomerId?: string;
    provider: "STRIPE" | "IYZICO" | "PAYTR" | "MANUAL_BANK_TRANSFER";
    status: "DRAFT" | "OPEN" | "PAID" | "VOID" | "UNCOLLECTIBLE" | "REFUNDED";
    currencyCode: "TRY" | "USD" | "EUR";
    externalInvoiceId?: string;
    invoiceNumber?: string;
    subtotalMinor: bigint;
    discountMinor?: bigint;
    taxMinor?: bigint;
    totalMinor: bigint;
    amountDueMinor: bigint;
    amountPaidMinor?: bigint;
    hostedInvoiceUrl?: string;
    issuedAt?: Date;
    dueAt?: Date;
    paidAt?: Date;
    lines: Array<{
      planId?: string;
      planPriceId?: string;
      description: string;
      quantity: number;
      unitAmountMinor: bigint;
      subtotalMinor: bigint;
      discountMinor?: bigint;
      taxMinor?: bigint;
      totalMinor: bigint;
    }>;
  }, client: DatabaseClient = prisma) {
    return client.invoice.create({
      data: {
        organizationId: input.scope.organizationId ?? null,
        userId: input.scope.userId ?? null,
        subscriptionId: input.subscriptionId ?? null,
        billingCustomerId: input.billingCustomerId ?? null,
        provider: input.provider,
        status: input.status,
        currencyCode: input.currencyCode,
        externalInvoiceId: input.externalInvoiceId ?? null,
        invoiceNumber: input.invoiceNumber ?? null,
        subtotalMinor: input.subtotalMinor,
        discountMinor: input.discountMinor ?? 0n,
        taxMinor: input.taxMinor ?? 0n,
        totalMinor: input.totalMinor,
        amountDueMinor: input.amountDueMinor,
        amountPaidMinor: input.amountPaidMinor ?? 0n,
        hostedInvoiceUrl: input.hostedInvoiceUrl ?? null,
        issuedAt: input.issuedAt ?? new Date(),
        dueAt: input.dueAt ?? null,
        paidAt: input.paidAt ?? null,
        lines: {
          create: input.lines.map((line) => ({
            planId: line.planId ?? null,
            planPriceId: line.planPriceId ?? null,
            description: line.description,
            quantity: line.quantity,
            unitAmountMinor: line.unitAmountMinor,
            subtotalMinor: line.subtotalMinor,
            discountMinor: line.discountMinor ?? 0n,
            taxMinor: line.taxMinor ?? 0n,
            totalMinor: line.totalMinor,
          })),
        },
      },
      select: {
        id: true,
      },
    });
  }

  async updateStatus(
    id: string,
    input: {
      status: "DRAFT" | "OPEN" | "PAID" | "VOID" | "UNCOLLECTIBLE" | "REFUNDED";
      amountPaidMinor?: bigint;
      paidAt?: Date | null;
      hostedInvoiceUrl?: string | null;
      externalInvoiceId?: string | null;
    },
    client: DatabaseClient = prisma,
  ) {
    const data: Prisma.InvoiceUncheckedUpdateInput = {
      status: input.status,
    };

    if (input.amountPaidMinor !== undefined) {
      data.amountPaidMinor = input.amountPaidMinor;
    }
    if (input.paidAt !== undefined) {
      data.paidAt = input.paidAt;
    }
    if (input.hostedInvoiceUrl !== undefined) {
      data.hostedInvoiceUrl = input.hostedInvoiceUrl;
    }
    if (input.externalInvoiceId !== undefined) {
      data.externalInvoiceId = input.externalInvoiceId;
    }

    return client.invoice.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
      },
    });
  }
}

export const invoiceRepository = new InvoiceRepository();
