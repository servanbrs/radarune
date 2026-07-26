import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

export class ProviderExternalReferenceRepository {
  async upsert(
    input: {
      organizationId: string;
      provider: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL";
      releaseId: string;
      referenceType: string;
      externalId: string;
      metadata?: Record<string, unknown>;
    },
    client: DatabaseClient = prisma,
  ) {
    const existing = await client.providerExternalReference.findUnique({
      where: {
        provider_externalId: {
          provider: input.provider,
          externalId: input.externalId,
        },
      },
      select: {
        id: true,
      },
    });

    const data: Prisma.ProviderExternalReferenceUncheckedCreateInput = {
      organizationId: input.organizationId,
      provider: input.provider,
      releaseId: input.releaseId,
      referenceType: input.referenceType,
      externalId: input.externalId,
      metadata: input.metadata
        ? (input.metadata as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    };

    if (existing) {
      return client.providerExternalReference.update({
        where: {
          id: existing.id,
        },
        data,
        select: {
          id: true,
        },
      });
    }

    return client.providerExternalReference.create({
      data,
      select: {
        id: true,
      },
    });
  }
}

export const providerExternalReferenceRepository = new ProviderExternalReferenceRepository();
