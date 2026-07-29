import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

const IV_LENGTH = 12;

function getEncryptionKey() {
  const source = env.BILLING_ENCRYPTION_KEY ?? env.DISTRIBUTION_ENCRYPTION_KEY ?? env.ENCRYPTION_KEY;
  if (!source) {
    throw new Error("Credential şifreleme anahtarı yapılandırılmamış. BILLING_ENCRYPTION_KEY, DISTRIBUTION_ENCRYPTION_KEY veya ENCRYPTION_KEY tanımlayın.");
  }

  return createHash("sha256").update(source).digest();
}

export function encryptBillingSecret(value: string) {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptBillingSecret(value: string) {
  const [ivBase64, tagBase64, encryptedBase64] = value.split(":");

  if (!ivBase64 || !tagBase64 || !encryptedBase64) {
    throw new Error("Billing secret formatı geçersiz.");
  }

  const key = getEncryptionKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivBase64, "base64"));
  decipher.setAuthTag(Buffer.from(tagBase64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
