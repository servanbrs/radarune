import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { prisma } from "@/server/prisma/prisma";

const PROVIDER = "YOUTUBE" as const;
const ENCRYPTION_VERSION = "v1";

type StoredYouTubeCredential = {
  apiKey: string;
};

type EncryptedPayload = {
  version: string;
  iv: string;
  authTag: string;
  content: string;
};

function encryptionSecret() {
  const value =
    process.env.INTEGRATION_ENCRYPTION_KEY?.trim() ||
    process.env.BETTER_AUTH_SECRET?.trim();

  if (!value) {
    throw new Error(
      "Credential şifreleme anahtarı bulunamadı. BETTER_AUTH_SECRET ayarlanmalıdır.",
    );
  }

  return createHash("sha256").update(value).digest();
}

function encryptCredential(value: StoredYouTubeCredential) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    encryptionSecret(),
    iv,
  );

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);

  const payload: EncryptedPayload = {
    version: ENCRYPTION_VERSION,
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    content: encrypted.toString("base64"),
  };

  return JSON.stringify(payload);
}

function decryptCredential(
  encryptedValue: string,
): StoredYouTubeCredential | null {
  try {
    const payload = JSON.parse(
      encryptedValue,
    ) as Partial<EncryptedPayload>;

    if (
      payload.version !== ENCRYPTION_VERSION ||
      !payload.iv ||
      !payload.authTag ||
      !payload.content
    ) {
      return null;
    }

    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionSecret(),
      Buffer.from(payload.iv, "base64"),
    );

    decipher.setAuthTag(
      Buffer.from(payload.authTag, "base64"),
    );

    const decrypted = Buffer.concat([
      decipher.update(
        Buffer.from(payload.content, "base64"),
      ),
      decipher.final(),
    ]);

    const parsed = JSON.parse(
      decrypted.toString("utf8"),
    ) as Partial<StoredYouTubeCredential>;

    if (
      typeof parsed.apiKey !== "string" ||
      !parsed.apiKey.trim()
    ) {
      return null;
    }

    return {
      apiKey: parsed.apiKey.trim(),
    };
  } catch {
    return null;
  }
}

function maskApiKey(value: string) {
  if (value.length <= 8) {
    return "••••••••";
  }

  return `${value.slice(0, 4)}••••••••${value.slice(-4)}`;
}

async function testYouTubeApiKey(apiKey: string) {
  const params = new URLSearchParams({
    part: "snippet",
    chart: "mostPopular",
    regionCode: "TR",
    videoCategoryId: "10",
    maxResults: "1",
    key: apiKey,
  });

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (response.ok) {
      return {
        success: true as const,
        message: "YouTube API bağlantısı başarılı.",
      };
    }

    const body = (await response.json().catch(() => null)) as {
      error?: {
        message?: string;
      };
    } | null;

    return {
      success: false as const,
      message:
        body?.error?.message ||
        `YouTube API bağlantısı başarısız: HTTP ${response.status}`,
    };
  } catch {
    return {
      success: false as const,
      message:
        "YouTube API sunucusuna bağlantı kurulamadı.",
    };
  }
}

class YouTubeAdminCredentialService {
  async getStatus(organizationId: string) {
    const credential =
      await prisma.integrationCredential.findUnique({
        where: {
          organizationId_provider: {
            organizationId,
            provider: PROVIDER,
          },
        },
        select: {
          active: true,
          credentialsEncrypted: true,
          lastTestedAt: true,
          lastTestError: true,
          updatedAt: true,
        },
      });

    if (!credential) {
      return {
        configured: false,
        active: false,
        maskedApiKey: null,
        lastTestedAt: null,
        lastTestError: null,
        updatedAt: null,
      };
    }

    const decrypted = decryptCredential(
      credential.credentialsEncrypted,
    );

    return {
      configured: Boolean(decrypted?.apiKey),
      active: credential.active,
      maskedApiKey: decrypted?.apiKey
        ? maskApiKey(decrypted.apiKey)
        : null,
      lastTestedAt:
        credential.lastTestedAt?.toISOString() ?? null,
      lastTestError: credential.lastTestError,
      updatedAt: credential.updatedAt.toISOString(),
    };
  }

  async getApiKey(organizationId: string) {
    const credential =
      await prisma.integrationCredential.findUnique({
        where: {
          organizationId_provider: {
            organizationId,
            provider: PROVIDER,
          },
        },
        select: {
          active: true,
          credentialsEncrypted: true,
        },
      });

    if (!credential?.active) {
      return null;
    }

    return (
      decryptCredential(credential.credentialsEncrypted)
        ?.apiKey ?? null
    );
  }

  async save(organizationId: string, apiKey: string) {
    const normalized = apiKey.trim();

    if (normalized.length < 20) {
      throw new Error(
        "Geçerli bir YouTube Data API anahtarı girin.",
      );
    }

    const connection = await testYouTubeApiKey(normalized);
    const now = new Date();

    await prisma.integrationCredential.upsert({
      where: {
        organizationId_provider: {
          organizationId,
          provider: PROVIDER,
        },
      },
      update: {
        credentialsEncrypted: encryptCredential({
          apiKey: normalized,
        }),
        active: connection.success,
        lastTestedAt: now,
        lastTestError: connection.success
          ? null
          : connection.message,
      },
      create: {
        organizationId,
        provider: PROVIDER,
        credentialsEncrypted: encryptCredential({
          apiKey: normalized,
        }),
        active: connection.success,
        lastTestedAt: now,
        lastTestError: connection.success
          ? null
          : connection.message,
      },
    });

    return connection;
  }

  async testSaved(organizationId: string) {
    const apiKey = await this.getApiKey(organizationId);

    if (!apiKey) {
      return {
        success: false as const,
        message:
          "Aktif bir YouTube API anahtarı bulunamadı.",
      };
    }

    const connection = await testYouTubeApiKey(apiKey);

    await prisma.integrationCredential.update({
      where: {
        organizationId_provider: {
          organizationId,
          provider: PROVIDER,
        },
      },
      data: {
        active: connection.success,
        lastTestedAt: new Date(),
        lastTestError: connection.success
          ? null
          : connection.message,
      },
    });

    return connection;
  }

  async remove(organizationId: string) {
    await prisma.integrationCredential.deleteMany({
      where: {
        organizationId,
        provider: PROVIDER,
      },
    });

    return {
      success: true as const,
    };
  }
}

export const youtubeAdminCredentialService =
  new YouTubeAdminCredentialService();
