import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { platformEncryptionKey } from "@/lib/env";

const IV_LENGTH = 12;

function getKey() {
  if (!platformEncryptionKey) {
    throw new Error("Platform şifreleme anahtarı yapılandırılmamış.");
  }
  return createHash("sha256").update(platformEncryptionKey).digest();
}

export function encryptPlatformSecret(value: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptPlatformSecret(value: string) {
  const [ivBase64, tagBase64, encryptedBase64] = value.split(":");
  if (!ivBase64 || !tagBase64 || !encryptedBase64) {
    throw new Error("Şifreli platform secret formatı geçersiz.");
  }
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivBase64, "base64"));
  decipher.setAuthTag(Buffer.from(tagBase64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function createPlatformApiKey() {
  return `rk_live_${randomBytes(32).toString("base64url")}`;
}

export function hashPlatformApiKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createWebhookSecret() {
  return `whsec_${randomBytes(36).toString("base64url")}`;
}
