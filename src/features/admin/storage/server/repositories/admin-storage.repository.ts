import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";

type TransactionClient = Prisma.TransactionClient;

export class AdminStorageRepository {
  async listProviders(organizationId: string) {
    const providers = await prisma.storageProvider.findMany({
      where: {
        organizationId,
      },
      include: {
        _count: {
          select: {
            uploads: true,
          },
        },
      },
      orderBy: [
        {
          isDefault: "desc",
        },
        {
          active: "desc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    const usage = await prisma.upload.groupBy({
      by: ["storageProviderId"],
      where: {
        organizationId,
        storageProviderId: {
          not: null,
        },
      },
      _count: {
        _all: true,
      },
      _sum: {
        byteSize: true,
      },
    });

    const usageByProvider = new Map(
      usage.map((item) => [
        item.storageProviderId,
        {
          fileCount: item._count._all,
          totalBytes: item._sum.byteSize ?? BigInt(0),
        },
      ]),
    );

    return providers.map((provider) => ({
      ...provider,
      usage: usageByProvider.get(provider.id) ?? {
        fileCount: provider._count.uploads,
        totalBytes: BigInt(0),
      },
    }));
  }

  async getOverview(organizationId: string) {
    const [
      totalUploads,
      readyUploads,
      pendingUploads,
      failedUploads,
      audioUploads,
      artworkUploads,
      storageUsage,
    ] = await Promise.all([
      prisma.upload.count({
        where: {
          organizationId,
        },
      }),
      prisma.upload.count({
        where: {
          organizationId,
          status: "READY",
        },
      }),
      prisma.upload.count({
        where: {
          organizationId,
          status: "PENDING",
        },
      }),
      prisma.upload.count({
        where: {
          organizationId,
          status: "FAILED",
        },
      }),
      prisma.upload.count({
        where: {
          organizationId,
          kind: "AUDIO",
        },
      }),
      prisma.upload.count({
        where: {
          organizationId,
          kind: "ARTWORK",
        },
      }),
      prisma.upload.aggregate({
        where: {
          organizationId,
        },
        _sum: {
          byteSize: true,
        },
      }),
    ]);

    return {
      totalUploads,
      readyUploads,
      pendingUploads,
      failedUploads,
      audioUploads,
      artworkUploads,
      totalBytes: storageUsage._sum.byteSize ?? BigInt(0),
    };
  }

  async findProvider(
    organizationId: string,
    providerId: string,
    tx: TransactionClient | typeof prisma = prisma,
  ) {
    return tx.storageProvider.findFirst({
      where: {
        id: providerId,
        organizationId,
      },
    });
  }

  async createLocalProvider(
    input: {
      organizationId: string;
      name: string;
      localBasePath: string;
      publicBaseUrl: string | null;
      maxFileSizeBytes: bigint | null;
    },
    tx: TransactionClient,
  ) {
    const providerCount = await tx.storageProvider.count({
      where: {
        organizationId: input.organizationId,
      },
    });

    const shouldBeDefault = providerCount === 0;

    return tx.storageProvider.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        type: "LOCAL",
        status: "CONFIGURATION_REQUIRED",
        active: false,
        isDefault: shouldBeDefault,
        configurationEncrypted: "{}",
        localBasePath: input.localBasePath,
        publicBaseUrl: input.publicBaseUrl,
        maxFileSizeBytes: input.maxFileSizeBytes,
      },
    });
  }

  async clearDefaultProvider(
    organizationId: string,
    tx: TransactionClient,
  ) {
    return tx.storageProvider.updateMany({
      where: {
        organizationId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });
  }

  async updateProvider(
    providerId: string,
    data: Prisma.StorageProviderUpdateInput,
    tx: TransactionClient,
  ) {
    return tx.storageProvider.update({
      where: {
        id: providerId,
      },
      data,
    });
  }
}

export const adminStorageRepository =
  new AdminStorageRepository();
