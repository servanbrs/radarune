import "server-only";

import { createHash, randomBytes } from "node:crypto";

export function hashPrivacyValue(
  value: string,
  salt = "radarune-growth",
) {
  return createHash("sha256")
    .update(`${salt}:${value}`)
    .digest("hex");
}

export function createSecureToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}
