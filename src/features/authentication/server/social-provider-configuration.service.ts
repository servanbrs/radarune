import "server-only";

import { prisma } from "@/server/prisma/prisma";
import { decryptBillingSecret } from "@/features/billing/server/lib/crypto";
import { env } from "@/lib/env";

type SocialProvider = "GOOGLE_OAUTH" | "FACEBOOK_OAUTH";

function environmentCredentials(provider: SocialProvider) {
  if (provider === "GOOGLE_OAUTH" && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) return { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET };
  if (provider === "FACEBOOK_OAUTH" && env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) return { clientId: env.FACEBOOK_CLIENT_ID, clientSecret: env.FACEBOOK_CLIENT_SECRET };
  return null;
}

export async function getSocialProviderCredentials(provider: SocialProvider) {
  try {
    const organization = await prisma.organization.findFirst({ where: { tenantStatus: "ACTIVE" }, orderBy: { createdAt: "asc" }, select: { id: true } });
    if (organization) {
      try {
        const row = await prisma.integrationCredential.findUnique({ where: { organizationId_provider: { organizationId: organization.id, provider } }, select: { active: true, credentialsEncrypted: true } });
        if (row?.active) {
          try {
            const parsed = JSON.parse(decryptBillingSecret(row.credentialsEncrypted)) as { clientId?: string; clientSecret?: string };
            if (parsed.clientId && parsed.clientSecret) return parsed;
          } catch {
            // Fall back to environment credentials without exposing the ciphertext.
          }
        }
      } catch {
        // Older deployments may not have applied the social credential migration yet.
      }
    }
  } catch {
    // A temporarily unavailable database must not break the sign-in page's
    // provider discovery. Actual authentication will still require the DB.
  }
  return environmentCredentials(provider);
}

export async function getSocialProviderAvailability() {
  // Social buttons are optional decoration on the sign-in page. Do not make
  // the primary login form wait on a remote/shared-host database connection.
  const availabilityTimeoutMs = 350;
  const resolveQuickly = async (provider: SocialProvider) => Promise.race([
    getSocialProviderCredentials(provider),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), availabilityTimeoutMs)),
  ]);
  const [google, facebook] = await Promise.all([resolveQuickly("GOOGLE_OAUTH"), resolveQuickly("FACEBOOK_OAUTH")]);
  return { google: Boolean(google), facebook: Boolean(facebook) };
}
