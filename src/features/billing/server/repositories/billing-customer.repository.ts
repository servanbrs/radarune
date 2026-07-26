import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";
import type { BillingScopeInput } from "@/features/billing/schemas/billing.schema";

export class BillingCustomerRepository {
  async findByScopeAndProvider(
    scope: BillingScopeInput,
    provider: "STRIPE" | "IYZICO" | "PAYTR" | "MANUAL_BANK_TRANSFER",
    client: DatabaseClient = prisma,
  ) {
    const where: Prisma.BillingCustomerWhereInput = {
      provider,
    };

    if (scope.organizationId) {
      where.organizationId = scope.organizationId;
    } else if (scope.userId) {
      where.userId = scope.userId;
    }

    return client.billingCustomer.findFirst({
      where,
      select: {
        id: true,
        provider: true,
        externalCustomerId: true,
        email: true,
        name: true,
        isActive: true,
      },
    });
  }

  async upsertCustomer(input: {
    scope: BillingScopeInput;
    provider: "STRIPE" | "IYZICO" | "PAYTR" | "MANUAL_BANK_TRANSFER";
    externalCustomerId: string;
    email: string;
    name: string;
  }, client: DatabaseClient = prisma) {
    const existing = await this.findByScopeAndProvider(input.scope, input.provider, client);

    if (existing) {
      return client.billingCustomer.update({
        where: {
          id: existing.id,
        },
        data: {
          externalCustomerId: input.externalCustomerId,
          email: input.email,
          name: input.name,
          isActive: true,
        },
        select: {
          id: true,
          externalCustomerId: true,
        },
      });
    }

    return client.billingCustomer.create({
      data: {
        organizationId: input.scope.organizationId ?? null,
        userId: input.scope.userId ?? null,
        provider: input.provider,
        externalCustomerId: input.externalCustomerId,
        email: input.email,
        name: input.name,
      },
      select: {
        id: true,
        externalCustomerId: true,
      },
    });
  }
}

export const billingCustomerRepository = new BillingCustomerRepository();
