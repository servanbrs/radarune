import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { env } from "@/lib/env";

const fallbackPepper = env.BETTER_AUTH_SECRET;

export function createOpaqueToken(prefix: "rat" | "rrt") {
  return `${prefix}_${randomBytes(48).toString("base64url")}`;
}

export function hashMobileSecret(value: string) {
  const pepper = env.MOBILE_REFRESH_TOKEN_PEPPER ?? env.MOBILE_ACCESS_TOKEN_SECRET ?? fallbackPepper;
  return createHash("sha256").update(`${pepper}:${value}`).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function maskToken(token: string) {
  if (token.length <= 12) {
    return "****";
  }
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export function hashIp(value: string | null) {
  if (!value) {
    return null;
  }
  return createHash("sha256").update(value).digest("hex");
}

export async function getMobileRequestFingerprint() {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerList.get("x-real-ip");
  const userAgent = headerList.get("user-agent");

  return {
    ipHash: hashIp(ip ?? null),
    userAgentHash: userAgent ? createHash("sha256").update(userAgent).digest("hex") : null,
  };
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}
