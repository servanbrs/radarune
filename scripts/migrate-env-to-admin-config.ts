import "dotenv/config";

import { encryptPlatformSecret } from "@/features/platform/server/lib/platform-crypto";
import { env } from "@/lib/env";
import { prisma } from "@/server/prisma/prisma";

type SettingKey =
  | "SMTP_MAIL_PROVIDER"
  | "SMTP_HOST"
  | "SMTP_PORT"
  | "SMTP_USERNAME"
  | "SMTP_PASSWORD"
  | "SMTP_FROM_EMAIL"
  | "DEFAULT_DISTRIBUTION_PROVIDER";

const mappings: Array<{ key: SettingKey; value: string | number | undefined }> = [
  { key: "SMTP_MAIL_PROVIDER", value: env.MAIL_PROVIDER },
  { key: "SMTP_HOST", value: env.SMTP_HOST },
  { key: "SMTP_PORT", value: env.SMTP_PORT },
  { key: "SMTP_USERNAME", value: env.SMTP_USERNAME },
  { key: "SMTP_PASSWORD", value: env.SMTP_PASSWORD },
  { key: "SMTP_FROM_EMAIL", value: env.SMTP_FROM_EMAIL },
  { key: "DEFAULT_DISTRIBUTION_PROVIDER", value: undefined },
];

async function main() {
  const organization = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!organization) {
    throw new Error("Env ayarlarını taşıyacak bir organization bulunamadı.");
  }

  let migrated = 0;
  for (const mapping of mappings) {
    if (mapping.value === undefined || mapping.value === "") continue;

    const existing = await prisma.adminSetting.findUnique({
      where: {
        organizationId_key: {
          organizationId: organization.id,
          key: mapping.key,
        },
      },
      select: { id: true },
    });

    if (existing) continue;

    const value = mapping.key === "SMTP_PASSWORD"
      ? encryptPlatformSecret(String(mapping.value))
      : mapping.value;

    await prisma.adminSetting.create({
      data: {
        organizationId: organization.id,
        key: mapping.key,
        value,
      },
    });
    migrated += 1;
  }

  console.info(`[config:migrate-env] ${migrated} ayar aktarıldı; mevcut admin ayarları korunmuştur.`);
}

main()
  .catch((error: unknown) => {
    console.error("[config:migrate-env] aktarım başarısız:", error instanceof Error ? error.message : "Bilinmeyen hata");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

