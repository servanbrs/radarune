import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

export class PaymentProviderConfigRepository {
  async listByOrganizationId(organizationId: string, client: DatabaseClient = prisma) {
    return client.paymentProviderConfig.findMany({
      where: {
        OR: [
          {
            organizationId,
          },
          {
            organizationId: null,
          },
        ],
      },
      orderBy: [
        {
          organizationId: "desc",
        },
        {
          provider: "asc",
        },
      ],
      select: {
        id: true,
        organizationId: true,
        provider: true,
        active: true,
        displayName: true,
        credentialsEncrypted: true,
        publicMetadata: true,
        webhookSecretEncrypted: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByOrganizationAndProvider(
    organizationId: string | null,
    provider: "STRIPE" | "IYZICO" | "PAYTR" | "MANUAL_BANK_TRANSFER",
    client: DatabaseClient = prisma,
  ) {
    return client.paymentProviderConfig.findFirst({
      where: {
        provider,
        ...(organizationId ? { organizationId } : { organizationId: null }),
      },
      select: {
        id: true,
        organizationId: true,
        provider: true,
        active: true,
        displayName: true,
        credentialsEncrypted: true,
        publicMetadata: true,
        webhookSecretEncrypted: true,
      },
    });
  }

  async upsert(input: {
    organizationId: string | null;
    provider: "STRIPE" | "IYZICO" | "PAYTR" | "MANUAL_BANK_TRANSFER";
    active: boolean;
    displayName?: string;
    credentialsEncrypted?: string | null;
    publicMetadata?: Record<string, string>;
    webhookSecretEncrypted?: string | null;
  }, client: DatabaseClient = prisma) {
    const data: Prisma.PaymentProviderConfigUncheckedCreateInput = {
      organizationId: input.organizationId,
      provider: input.provider,
      active: input.active,
      displayName: input.displayName ?? null,
      credentialsEncrypted: input.credentialsEncrypted ?? null,
      publicMetadata: input.publicMetadata
        ? (input.publicMetadata as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      webhookSecretEncrypted: input.webhookSecretEncrypted ?? null,
    };

    const existing = await client.paymentProviderConfig.findFirst({
      where: {
        provider: input.provider,
        ...(input.organizationId
          ? { organizationId: input.organizationId }
          : { organizationId: null }),
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return client.paymentProviderConfig.update({
        where: {
          id: existing.id,
        },
        data,
        select: {
          id: true,
        },
      });
    }

    return client.paymentProviderConfig.create({
      data,
      select: {
        id: true,
      },
    });
  }
}

export const paymentProviderConfigRepository = new PaymentProviderConfigRepository();
