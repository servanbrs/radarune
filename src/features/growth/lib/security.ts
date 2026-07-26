import { createHash, randomBytes } from "node:crypto";

const forbiddenSlugs = new Set([
  "admin",
  "api",
  "auth",
  "dashboard",
  "sign-in",
  "sign-up",
  "settings",
  "billing",
  "releases",
  "artists",
  "labels",
  "smart-links",
  "presaves",
  "discover",
  "playlist",
  "unsubscribe",
]);

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function assertAllowedSlug(slug: string) {
  if (forbiddenSlugs.has(slug)) {
    throw new Error("Bu slug sistem route'ları için ayrılmıştır.");
  }
}

export function assertHttpsUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error("Bağlantı URL'i HTTPS olmalıdır.");
  }
  return url.toString();
}

export function hashPrivacyValue(value: string, salt = "radarune-growth") {
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

export function createSecureToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}
