import "server-only";
import { prisma } from "@/server/prisma/prisma";
import { env } from "@/lib/env";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

type HealthResult = { checkKey: string; status: "PASS" | "WARNING" | "FAIL" | "NOT_CONFIGURED"; message: string };

export class SystemHealthService {
  async run(actor: FinanceActorContext) {
    assertAdminPermission(actor, "system:health:view");
    const checks: HealthResult[] = [];
    try {
      await prisma.organization.count({ where: { id: actor.organizationId } });
      checks.push({ checkKey: "database", status: "PASS", message: "Veritabanı sorgusu başarılı." });
    } catch {
      checks.push({ checkKey: "database", status: "FAIL", message: "Veritabanı sorgusu başarısız." });
    }
    checks.push({ checkKey: "better_auth_secret", status: env.BETTER_AUTH_SECRET.length >= 32 ? "PASS" : "FAIL", message: env.BETTER_AUTH_SECRET.length >= 32 ? "Better Auth secret yapılandırıldı." : "Better Auth secret yetersiz." });
    checks.push({ checkKey: "public_url", status: env.NEXT_PUBLIC_APP_URL ? "PASS" : "FAIL", message: env.NEXT_PUBLIC_APP_URL ? "Public URL yapılandırıldı." : "Public URL eksik." });
    checks.push({ checkKey: "webhook_encryption", status: env.WEBHOOK_ENCRYPTION_KEY ? "PASS" : "NOT_CONFIGURED", message: env.WEBHOOK_ENCRYPTION_KEY ? "Webhook secret şifreleme hazır." : "WEBHOOK_ENCRYPTION_KEY yapılandırılmamış." });
    checks.push({ checkKey: "mail", status: "NOT_CONFIGURED", message: "E-posta provider bağlantısı henüz yapılandırılmamış." });
    checks.push({ checkKey: "queue", status: "WARNING", message: "Queue worker durumu runtime health check ile ayrıca izlenmelidir." });
    await prisma.$transaction(checks.map((check) => prisma.systemHealthCheck.upsert({ where: { organizationId_checkKey: { organizationId: actor.organizationId, checkKey: check.checkKey } }, update: { status: check.status, message: check.message, checkedAt: new Date() }, create: { organizationId: actor.organizationId, ...check } })));
    return checks;
  }
}

export const systemHealthService = new SystemHealthService();
