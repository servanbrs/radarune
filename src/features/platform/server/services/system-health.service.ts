import "server-only";

import { prisma } from "@/server/prisma/prisma";
import { env } from "@/lib/env";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { verifyEmailTransport } from "@/features/email/server/email-settings.service";

import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import type {
  SystemHealthCheckResult,
  SystemHealthReport,
  SystemHealthStatus,
} from "@/features/platform/types/system-health";

type InternalHealthCheck = Omit<SystemHealthCheckResult, "checkedAt">;

function getOverallStatus(
  checks: InternalHealthCheck[],
): SystemHealthStatus {
  if (checks.some((check) => check.status === "FAIL")) {
    return "FAIL";
  }

  if (
    checks.some(
      (check) =>
        check.status === "WARNING" ||
        check.status === "NOT_CONFIGURED",
    )
  ) {
    return "WARNING";
  }

  return "PASS";
}

function calculateScore(checks: InternalHealthCheck[]): number {
  if (checks.length === 0) {
    return 0;
  }

  const points = checks.reduce((total, check) => {
    switch (check.status) {
      case "PASS":
        return total + 1;

      case "WARNING":
        return total + 0.5;

      case "NOT_CONFIGURED":
        return total + 0.25;

      case "FAIL":
        return total;

      default:
        return total;
    }
  }, 0);

  return Math.round((points / checks.length) * 100);
}

async function runMeasuredCheck(
  input: Omit<InternalHealthCheck, "durationMs">,
  operation?: () => Promise<Pick<InternalHealthCheck, "status" | "message"> | void>,
): Promise<InternalHealthCheck> {
  const startedAt = Date.now();

  if (!operation) {
    return {
      ...input,
      durationMs: Date.now() - startedAt,
    };
  }

  try {
    const result = await operation();

    return {
      ...input,
      ...(result ?? {}),
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    const rawDetail = error instanceof Error
      ? error.message.replace(/(password|passwd|pwd)=([^&\s]+)/gi, "$1=***").slice(0, 180)
      : "Bilinmeyen hata.";
    const detail = /authentication failed|invalid login/i.test(rawDetail)
      ? "SMTP kullanıcı adı veya parola reddedildi. Sunucu, port, TLS modu ve SMTP hesabının gönderim iznini kontrol edin."
      : rawDetail;
    return {
      ...input,
      status: "FAIL",
      message: `${input.title} kontrolü başarısız oldu: ${detail}`,
      durationMs: Date.now() - startedAt,
    };
  }
}

export class SystemHealthService {
  async run(actor: FinanceActorContext): Promise<SystemHealthReport> {
    assertAdminPermission(actor, "system:health:view");

    const startedAt = Date.now();
    const checkedAt = new Date();

    const databaseCheck = await runMeasuredCheck(
      {
        checkKey: "database",
        title: "Veritabanı",
        status: "PASS",
        message: "Veritabanı sorgusu başarılı.",
      },
      async () => {
        await prisma.organization.count({
          where: {
            id: actor.organizationId,
          },
        });
      },
    );

    const betterAuthSecretIsValid =
      env.BETTER_AUTH_SECRET.length >= 32;

    const betterAuthCheck = await runMeasuredCheck({
      checkKey: "better_auth_secret",
      title: "Better Auth",
      status: betterAuthSecretIsValid ? "PASS" : "FAIL",
      message: betterAuthSecretIsValid
        ? "Better Auth secret güvenli uzunlukta yapılandırıldı."
        : "Better Auth secret en az 32 karakter olmalıdır.",
    });

    const publicUrlIsConfigured =
      env.NEXT_PUBLIC_APP_URL.trim().length > 0;

    const publicUrlCheck = await runMeasuredCheck({
      checkKey: "public_url",
      title: "Public URL",
      status: publicUrlIsConfigured ? "PASS" : "FAIL",
      message: publicUrlIsConfigured
        ? `Public URL yapılandırıldı: ${env.NEXT_PUBLIC_APP_URL}`
        : "NEXT_PUBLIC_APP_URL yapılandırılmamış.",
    });

    const webhookEncryptionIsConfigured =
      Boolean(env.WEBHOOK_ENCRYPTION_KEY);

    const webhookEncryptionCheck = await runMeasuredCheck({
      checkKey: "webhook_encryption",
      title: "Webhook Şifreleme",
      status: webhookEncryptionIsConfigured
        ? "PASS"
        : "NOT_CONFIGURED",
      message: webhookEncryptionIsConfigured
        ? "Webhook secret şifreleme anahtarı hazır."
        : "WEBHOOK_ENCRYPTION_KEY yapılandırılmamış.",
    });

    const mailCheck = await runMeasuredCheck(
      {
        checkKey: "mail",
        title: "E-posta Servisi",
        status: "PASS",
        message: "SMTP bağlantı testi başarılı.",
      },
      async () => {
        await verifyEmailTransport(actor.organizationId);
      },
    );

    const queueCheck = await runMeasuredCheck(
      {
        checkKey: "queue",
        title: "Distribution Queue",
        status: "PASS",
        message: "Bekleyen veya kilitli job bulunmuyor.",
      },
      async () => {
        const [pendingJobs, staleJobs] = await Promise.all([
          prisma.distributionJob.count({
            where: { organizationId: actor.organizationId, status: { in: ["PENDING", "QUEUED", "RETRY_SCHEDULED"] } },
          }),
          prisma.distributionJob.count({
            where: { organizationId: actor.organizationId, status: "PROCESSING", lockedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } },
          }),
        ]);

        return staleJobs > 0
          ? { status: "FAIL" as const, message: `${staleJobs} job 10 dakikadan uzun süredir kilitli.` }
          : pendingJobs > 0
            ? { status: "WARNING" as const, message: `${pendingJobs} job worker tarafından bekliyor.` }
            : undefined;
      },
    );

    const checks: InternalHealthCheck[] = [
      databaseCheck,
      betterAuthCheck,
      publicUrlCheck,
      webhookEncryptionCheck,
      mailCheck,
      queueCheck,
    ];

    try {
      await prisma.$transaction(
        checks.map((check) =>
          prisma.systemHealthCheck.upsert({
            where: {
              organizationId_checkKey: {
                organizationId: actor.organizationId,
                checkKey: check.checkKey,
              },
            },
            update: { status: check.status, message: check.message, checkedAt },
            create: {
              organizationId: actor.organizationId,
              checkKey: check.checkKey,
              status: check.status,
              message: check.message,
              checkedAt,
            },
          }),
        ),
      );
    } catch {
      // Health checks must still be returned when persistence is unavailable.
    }

    const serializedChecks: SystemHealthCheckResult[] = checks.map(
      (check) => ({
        ...check,
        checkedAt: checkedAt.toISOString(),
      }),
    );

    const status = getOverallStatus(checks);
    const failed = checks.filter(
      (check) => check.status === "FAIL",
    ).length;

    return {
      status,
      score: calculateScore(checks),
      ready: failed === 0,
      checkedAt: checkedAt.toISOString(),
      durationMs: Date.now() - startedAt,
      totals: {
        checks: checks.length,
        passed: checks.filter(
          (check) => check.status === "PASS",
        ).length,
        warnings: checks.filter(
          (check) => check.status === "WARNING",
        ).length,
        failed,
        notConfigured: checks.filter(
          (check) => check.status === "NOT_CONFIGURED",
        ).length,
      },
      checks: serializedChecks,
    };
  }
}

export const systemHealthService = new SystemHealthService();
