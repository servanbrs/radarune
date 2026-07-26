import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

const ivLength = 12;

function getKey() {
  const source = env.MOBILE_ENCRYPTION_KEY ?? env.BILLING_ENCRYPTION_KEY ?? env.BETTER_AUTH_SECRET;
  return createHash("sha256").update(source).digest();
}

export function encryptMobileSecret(value: string) {
  const iv = randomBytes(ivLength);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptMobileSecret(value: string) {
  const [ivBase64, tagBase64, encryptedBase64] = value.split(":");
  if (!ivBase64 || !tagBase64 || !encryptedBase64) {
    throw new Error("Mobile secret formatı geçersiz.");
  }

  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivBase64, "base64"));
  decipher.setAuthTag(Buffer.from(tagBase64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
