import "server-only";

import { access, mkdir } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/server/prisma/prisma";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { adminStorageRepository } from "@/features/admin/storage/server/repositories/admin-storage.repository";

type CreateLocalProviderInput = {
  name: string;
  localBasePath: string;
  publicBaseUrl?: string;
  maxFileSizeMb?: number;
};

function normalizeLocalPath(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Yerel depolama dizini zorunludur.");
  }

  return path.resolve(trimmed);
}

function normalizePublicUrl(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).toString().replace(/\/$/, "");
  } catch {
    throw new Error("Public URL geçerli bir adres olmalıdır.");
  }
}

export class AdminStorageService {
  async getDashboard(actor: FinanceActorContext) {
    assertAdminPermission(actor, "settings.view");

    const [providers, overview] = await Promise.all([
      adminStorageRepository.listProviders(
        actor.organizationId,
      ),
      adminStorageRepository.getOverview(
        actor.organizationId,
      ),
    ]);

    return {
      providers,
      overview,
    };
  }

  async createLocalProvider(
    actor: FinanceActorContext,
    input: CreateLocalProviderInput,
  ) {
    assertAdminPermission(actor, "settings.manage");

    const name = input.name.trim();

    if (name.length < 2) {
      throw new Error(
        "Provider adı en az 2 karakter olmalıdır.",
      );
    }

    const localBasePath = normalizeLocalPath(
      input.localBasePath,
    );

    const publicBaseUrl = normalizePublicUrl(
      input.publicBaseUrl,
    );

    const maxFileSizeMb = input.maxFileSizeMb ?? 512;

    if (
      !Number.isFinite(maxFileSizeMb) ||
      maxFileSizeMb <= 0
    ) {
      throw new Error(
        "Maksimum dosya boyutu sıfırdan büyük olmalıdır.",
      );
    }

    const maxFileSizeBytes = BigInt(
      Math.round(maxFileSizeMb * 1024 * 1024),
    );

    return prisma.$transaction(async (tx) => {
      const provider =
        await adminStorageRepository.createLocalProvider(
          {
            organizationId: actor.organizationId,
            name,
            localBasePath,
            publicBaseUrl,
            maxFileSizeBytes,
          },
          tx,
        );

      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: "STORAGE_PROVIDER_CREATED",
          entityType: "StorageProvider",
          entityId: provider.id,
          metadata: {
            name: provider.name,
            type: provider.type,
          },
        },
        tx,
      );

      return provider;
    });
  }

  async setDefaultProvider(
    actor: FinanceActorContext,
    providerId: string,
  ) {
    assertAdminPermission(actor, "settings.manage");

    const provider =
      await adminStorageRepository.findProvider(
        actor.organizationId,
        providerId,
      );

    if (!provider) {
      throw new Error("Storage provider bulunamadı.");
    }

    return prisma.$transaction(async (tx) => {
      await adminStorageRepository.clearDefaultProvider(
        actor.organizationId,
        tx,
      );

      const updated =
        await adminStorageRepository.updateProvider(
          provider.id,
          {
            isDefault: true,
          },
          tx,
        );

      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: "STORAGE_PROVIDER_DEFAULT_CHANGED",
          entityType: "StorageProvider",
          entityId: provider.id,
          metadata: {
            providerName: provider.name,
          },
        },
        tx,
      );

      return updated;
    });
  }

  async toggleProvider(
    actor: FinanceActorContext,
    providerId: string,
  ) {
    assertAdminPermission(actor, "settings.manage");

    const provider =
      await adminStorageRepository.findProvider(
        actor.organizationId,
        providerId,
      );

    if (!provider) {
      throw new Error("Storage provider bulunamadı.");
    }

    if (
      !provider.active &&
      provider.status !== "ACTIVE"
    ) {
      throw new Error(
        "Provider etkinleştirilmeden önce bağlantı testi başarılı olmalıdır.",
      );
    }

    return prisma.$transaction(async (tx) => {
      const updated =
        await adminStorageRepository.updateProvider(
          provider.id,
          {
            active: !provider.active,
          },
          tx,
        );

      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: updated.active
            ? "STORAGE_PROVIDER_ENABLED"
            : "STORAGE_PROVIDER_DISABLED",
          entityType: "StorageProvider",
          entityId: provider.id,
          metadata: {
            providerName: provider.name,
          },
        },
        tx,
      );

      return updated;
    });
  }

  async testProvider(
    actor: FinanceActorContext,
    providerId: string,
  ) {
    assertAdminPermission(actor, "settings.manage");

    const provider =
      await adminStorageRepository.findProvider(
        actor.organizationId,
        providerId,
      );

    if (!provider) {
      throw new Error("Storage provider bulunamadı.");
    }

    if (provider.type !== "LOCAL") {
      throw new Error(
        "Bu sürümde yalnızca Local Storage bağlantı testi destekleniyor.",
      );
    }

    if (!provider.localBasePath) {
      throw new Error(
        "Local Storage dizini yapılandırılmamış.",
      );
    }

    let status: "ACTIVE" | "FAILED" = "ACTIVE";
    let lastError: string | null = null;

    try {
      await mkdir(provider.localBasePath, {
        recursive: true,
      });

      await access(provider.localBasePath);
    } catch (error) {
      status = "FAILED";
      lastError =
        error instanceof Error
          ? error.message
          : "Depolama dizinine erişilemedi.";
    }

    return prisma.$transaction(async (tx) => {
      const updated =
        await adminStorageRepository.updateProvider(
          provider.id,
          {
            status,
            lastCheckedAt: new Date(),
            lastError,
          },
          tx,
        );

      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: "STORAGE_PROVIDER_TESTED",
          entityType: "StorageProvider",
          entityId: provider.id,
          metadata: {
            providerName: provider.name,
            status,
            error: lastError,
          },
        },
        tx,
      );

      return updated;
    });
  }
}

export const adminStorageService =
  new AdminStorageService();
