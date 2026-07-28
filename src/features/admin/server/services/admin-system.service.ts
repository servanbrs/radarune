import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { updateAdminSettingSchema, type UpdateAdminSettingInput } from "@/features/admin/schemas/admin.schema";
import { adminSystemRepository } from "@/features/admin/server/repositories/admin-system.repository";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

const defaults: Array<{ key: UpdateAdminSettingInput["key"]; value: string | boolean | number }> = [
  { key: "PLATFORM_NAME", value: "Radarune" },
  { key: "LOGO_URL", value: "" },
  { key: "SUPPORT_EMAIL", value: "support@radarune.com" },
  { key: "SEO_TITLE", value: "Radarune | Müzik operasyon platformu" },
  { key: "SEO_DESCRIPTION", value: "Sanatçılar ve label ekipleri için yayın, dağıtım ve gelir yönetimi." },
  { key: "DEFAULT_DISTRIBUTION_PROVIDER", value: "INTERNAL" },
  { key: "AUTO_DISTRIBUTION_ENABLED", value: false },
  { key: "MAX_AUDIO_FILE_SIZE_BYTES", value: 536870912 },
  { key: "MAX_ARTWORK_FILE_SIZE_BYTES", value: 20971520 },
  { key: "MIN_ARTWORK_RESOLUTION", value: 3000 },
  { key: "USER_REGISTRATION_ENABLED", value: true },
  { key: "ARTIST_APPLICATIONS_ENABLED", value: true },
  { key: "EMAIL_VERIFICATION_REQUIRED", value: true },
  { key: "MAINTENANCE_MODE_ENABLED", value: false },
  { key: "MAINTENANCE_MESSAGE", value: "" },
];

export class AdminSystemService {
  async listAuditLogs(actor: FinanceActorContext, params: { page: number; pageSize: number }) {
    assertAdminPermission(actor, "audit.view");
    return adminSystemRepository.listAuditLogs({ ...params, organizationId: actor.organizationId });
  }

  async listSystemLogs(actor: FinanceActorContext, params: { page: number; pageSize: number }) {
    assertAdminPermission(actor, "system-logs.view");
    return adminSystemRepository.listSystemLogs({ ...params, organizationId: actor.organizationId });
  }

  async listSettings(actor: FinanceActorContext) {
    assertAdminPermission(actor, "settings.view");
    const settings = await adminSystemRepository.listSettings(actor.organizationId);
    const existing = new Map(settings.map((setting) => [setting.key, setting]));

    return defaults.map((setting) => ({
      key: setting.key,
      value: existing.get(setting.key)?.value ?? setting.value,
      updatedAt: existing.get(setting.key)?.updatedAt ?? null,
    }));
  }

  async updateSetting(actor: FinanceActorContext, input: UpdateAdminSettingInput) {
    assertAdminPermission(actor, "settings.manage");
    const parsed = updateAdminSettingSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const setting = await adminSystemRepository.upsertSetting(
        {
          organizationId: actor.organizationId,
          key: parsed.key,
          value: parsed.value as Prisma.InputJsonValue,
          updatedByUserId: actor.userId,
        },
        tx,
      );

      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: "ADMIN_SETTING_UPDATED",
          entityType: "AdminSetting",
          entityId: setting.id,
          metadata: {
            key: parsed.key,
            reason: parsed.reason,
          },
        },
        tx,
      );

      return setting;
    });
  }
}

export const adminSystemService = new AdminSystemService();
