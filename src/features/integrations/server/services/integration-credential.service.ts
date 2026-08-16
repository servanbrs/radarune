import "server-only";
import { z } from "zod";
import { encryptBillingSecret, decryptBillingSecret } from "@/features/billing/server/lib/crypto";
import { prisma } from "@/server/prisma/prisma";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { env } from "@/lib/env";

const schema = z.object({
  provider: z.enum(["YOUTUBE", "SPOTIFY", "GOOGLE_OAUTH", "FACEBOOK_OAUTH", "WHATSAPP"]),
  credentials: z.record(z.string(), z.string().trim().min(1)),
});

const CREDENTIAL_KEY_MISMATCH_MESSAGE =
  "Credential kaydı çözülemedi. Sunucudaki BILLING_ENCRYPTION_KEY (veya DISTRIBUTION_ENCRYPTION_KEY/ENCRYPTION_KEY) eski kayıt oluşturulurken kullanılan anahtarla aynı olmalı; anahtar değiştiyse credential’ı yeniden kaydedin.";

type IntegrationProvider = "YOUTUBE" | "SPOTIFY" | "GOOGLE_OAUTH" | "FACEBOOK_OAUTH" | "WHATSAPP";

function environmentCredentials(provider: IntegrationProvider): Record<string, string> | null {
  if (provider === "YOUTUBE" && env.YOUTUBE_API_KEY) return { apiKey: env.YOUTUBE_API_KEY };
  if (provider === "SPOTIFY" && env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET) {
    return { clientId: env.SPOTIFY_CLIENT_ID, clientSecret: env.SPOTIFY_CLIENT_SECRET };
  }
  if (provider === "GOOGLE_OAUTH" && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    return { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET };
  }
  if (provider === "FACEBOOK_OAUTH" && env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
    return { clientId: env.FACEBOOK_CLIENT_ID, clientSecret: env.FACEBOOK_CLIENT_SECRET };
  }
  return null;
}

function hasUsableCredentials(provider: IntegrationProvider, credentials: unknown): credentials is Record<string, string> {
  if (!credentials || typeof credentials !== "object") return false;
  const values = credentials as Record<string, unknown>;
  if (provider === "SPOTIFY" || provider === "GOOGLE_OAUTH" || provider === "FACEBOOK_OAUTH") {
    return typeof values.clientId === "string" && Boolean(values.clientId.trim())
      && typeof values.clientSecret === "string" && Boolean(values.clientSecret.trim());
  }
  if (provider === "YOUTUBE") return typeof values.apiKey === "string" && Boolean(values.apiKey.trim());
  return Object.values(values).some((value) => typeof value === "string" && Boolean(value.trim()));
}

export class IntegrationCredentialService {
  private async fallbackCredentials(organizationId: string, provider: IntegrationProvider) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { tenantMode: true },
    });
    if (organization?.tenantMode !== "SINGLE_TENANT") return environmentCredentials(provider);

    const sharedRow = await prisma.integrationCredential.findFirst({
      where: { provider, active: true, organization: { tenantMode: "SINGLE_TENANT" } },
      orderBy: { updatedAt: "desc" },
    });
    if (!sharedRow) return environmentCredentials(provider);
    try {
      const parsed: unknown = JSON.parse(decryptBillingSecret(sharedRow.credentialsEncrypted));
      return hasUsableCredentials(provider, parsed) ? parsed : environmentCredentials(provider);
    } catch {
      return environmentCredentials(provider);
    }
  }

  async list(actor: FinanceActorContext) {
    assertAdminPermission(actor, "integrations.spotify.view");
    const rows = await prisma.integrationCredential.findMany({
      where: { organizationId: actor.organizationId },
      select: { provider: true, active: true, lastTestedAt: true, lastTestError: true, credentialsEncrypted: true },
    });
    return rows.map((row) => ({
      provider: row.provider,
      active: row.active,
      hasCredentials: Boolean(row.credentialsEncrypted),
      lastTestedAt: row.lastTestedAt,
      lastTestError: row.lastTestError,
    }));
  }

  async upsert(actor: FinanceActorContext, input: unknown) {
    const parsed = schema.parse(input);
    assertAdminPermission(actor, parsed.provider === "YOUTUBE" ? "integrations.youtube.view" : "integrations.spotify.view");
    const row = await prisma.integrationCredential.upsert({
      where: { organizationId_provider: { organizationId: actor.organizationId, provider: parsed.provider } },
      update: { credentialsEncrypted: encryptBillingSecret(JSON.stringify(parsed.credentials)), active: true, lastTestError: null },
      create: { organizationId: actor.organizationId, provider: parsed.provider, credentialsEncrypted: encryptBillingSecret(JSON.stringify(parsed.credentials)) },
    });
    await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "INTEGRATION_CREDENTIAL_UPDATED", entityType: "IntegrationCredential", entityId: row.id, metadata: { provider: parsed.provider } });
    return { provider: row.provider, active: row.active, hasCredentials: true };
  }

  /**
   * Resolve credentials for server-side providers. A deployment can have an
   * encrypted row from an older encryption key; never let that crypto error
   * crash an import job. Mark the stale row and use environment credentials as
   * a safe fallback when they are configured, otherwise return null so the
   * caller can show a normal configuration error.
   */
  async runtime(organizationId: string, provider: IntegrationProvider) {
    const row = await prisma.integrationCredential.findUnique({ where: { organizationId_provider: { organizationId, provider } } });
    if (!row?.active) return this.fallbackCredentials(organizationId, provider);

    try {
      const parsed: unknown = JSON.parse(decryptBillingSecret(row.credentialsEncrypted));
      if (!hasUsableCredentials(provider, parsed)) throw new Error("Credential alanları eksik veya geçersiz.");
      return parsed;
    } catch {
      // AES-GCM reports this as “Unsupported state or unable to authenticate
      // data” when the encryption key changed or the ciphertext was damaged.
      // Keep the import pipeline alive and make the admin-facing status useful.
      await prisma.integrationCredential.update({
        where: { id: row.id },
        data: { active: false, lastTestError: CREDENTIAL_KEY_MISMATCH_MESSAGE },
      }).catch(() => undefined);
      return this.fallbackCredentials(organizationId, provider);
    }
  }

  async listSocial(actor: FinanceActorContext) {
    assertAdminPermission(actor, "integrations.spotify.view");
    const providers: ("GOOGLE_OAUTH" | "FACEBOOK_OAUTH")[] = ["GOOGLE_OAUTH", "FACEBOOK_OAUTH"];
    let rows: Array<{ provider: "GOOGLE_OAUTH" | "FACEBOOK_OAUTH"; active: boolean; lastTestedAt: Date | null; lastTestError: string | null; credentialsEncrypted: string }> = [];
    try {
      rows = await prisma.integrationCredential.findMany({
        where: { organizationId: actor.organizationId, provider: { in: providers } },
        select: { provider: true, active: true, lastTestedAt: true, lastTestError: true, credentialsEncrypted: true },
      }) as typeof rows;
    } catch {
      // The page can still show env-backed status while an older DB is migrated.
    }
    return providers.map((provider) => {
      const row = rows.find((item) => item.provider === provider);
      const environment = environmentCredentials(provider);
      return { provider, active: row?.active ?? Boolean(environment), hasCredentials: Boolean(row?.credentialsEncrypted || environment), lastTestedAt: row?.lastTestedAt ?? null, lastTestError: row?.lastTestError ?? null };
    });
  }

  async upsertSocial(actor: FinanceActorContext, provider: "GOOGLE_OAUTH" | "FACEBOOK_OAUTH", credentials: { clientId: string; clientSecret?: string }) {
    assertAdminPermission(actor, "integrations.spotify.view");
    const current = await prisma.integrationCredential.findUnique({ where: { organizationId_provider: { organizationId: actor.organizationId, provider } }, select: { credentialsEncrypted: true } });
    let clientSecret = credentials.clientSecret?.trim();
    if (!clientSecret && current?.credentialsEncrypted) {
      try { clientSecret = (JSON.parse(decryptBillingSecret(current.credentialsEncrypted)) as { clientSecret?: string }).clientSecret; } catch { clientSecret = undefined; }
    }
    if (!credentials.clientId.trim() || !clientSecret) throw new Error("Client ID ve Client Secret zorunludur.");
    const row = await prisma.integrationCredential.upsert({
      where: { organizationId_provider: { organizationId: actor.organizationId, provider } },
      update: { credentialsEncrypted: encryptBillingSecret(JSON.stringify({ clientId: credentials.clientId.trim(), clientSecret })), active: true, lastTestError: null },
      create: { organizationId: actor.organizationId, provider, credentialsEncrypted: encryptBillingSecret(JSON.stringify({ clientId: credentials.clientId.trim(), clientSecret })) },
    });
    await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "SOCIAL_AUTH_PROVIDER_UPDATED", entityType: "IntegrationCredential", entityId: row.id, metadata: { provider } });
    return { provider, active: true, hasCredentials: true };
  }

  async whatsapp(organizationId: string) {
    const row = await prisma.integrationCredential.findUnique({ where: { organizationId_provider: { organizationId, provider: "WHATSAPP" } } });
    if (!row?.active) return null;
    try { return JSON.parse(decryptBillingSecret(row.credentialsEncrypted)) as Record<string, string>; } catch { return null; }
  }

  async whatsappWebhookConfig() {
    const row = await prisma.integrationCredential.findFirst({ where: { provider: "WHATSAPP", active: true }, orderBy: { updatedAt: "desc" } });
    if (!row) return null;
    try { return JSON.parse(decryptBillingSecret(row.credentialsEncrypted)) as Record<string, string>; } catch { return null; }
  }

  async upsertWhatsapp(actor: FinanceActorContext, credentials: Record<string, string>) {
    assertAdminPermission(actor, "integrations.spotify.view");
    const current = await prisma.integrationCredential.findUnique({ where: { organizationId_provider: { organizationId: actor.organizationId, provider: "WHATSAPP" } }, select: { credentialsEncrypted: true } });
    if (!credentials.accessToken?.trim() && current?.credentialsEncrypted) {
      try { credentials.accessToken = (JSON.parse(decryptBillingSecret(current.credentialsEncrypted)) as { accessToken?: string }).accessToken ?? ""; } catch { /* token yeniden istenir */ }
    }
    const required = ["phoneNumberId", "accessToken", "recipients", "templateName", "templateLanguage", "verifyToken"];
    if (required.some((key) => !credentials[key]?.trim())) throw new Error("WhatsApp telefon ID, token, alıcı, şablon adı ve dil alanları zorunludur.");
    const verifyToken = credentials.verifyToken?.trim();
    if (!verifyToken || !/^[\x20-\x7E]+$/.test(verifyToken)) {
      throw new Error("Meta doğrulama belirteci yalnızca İngilizce harf, rakam ve temel sembollerden oluşmalıdır.");
    }
    const row = await prisma.integrationCredential.upsert({
      where: { organizationId_provider: { organizationId: actor.organizationId, provider: "WHATSAPP" } },
      update: { credentialsEncrypted: encryptBillingSecret(JSON.stringify(credentials)), active: true, lastTestError: null },
      create: { organizationId: actor.organizationId, provider: "WHATSAPP", credentialsEncrypted: encryptBillingSecret(JSON.stringify(credentials)) },
    });
    await auditLogService.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "WHATSAPP_INTEGRATION_UPDATED", entityType: "IntegrationCredential", entityId: row.id });
    return { active: true };
  }
}

export const integrationCredentialService = new IntegrationCredentialService();
