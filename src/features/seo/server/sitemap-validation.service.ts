import type { SitemapEntry } from "@/features/seo/server/sitemap.service";

const blockedPathPrefixes = [
  "/admin",
  "/moderator",
  "/dashboard",
  "/api",
  "/auth",
  "/account",
  "/settings",
  "/checkout",
  "/billing",
  "/private-preview",
];

export type SitemapValidation = {
  valid: boolean;
  errors: string[];
  duplicateCount: number;
};

export function validateSitemapEntries(entries: SitemapEntry[]): SitemapValidation {
  const errors: string[] = [];
  const seen = new Set<string>();
  let duplicateCount = 0;

  for (const entry of entries) {
    let parsed: URL;
    try {
      parsed = new URL(entry.url);
    } catch {
      errors.push(`Geçersiz URL: ${entry.url}`);
      continue;
    }

    if (parsed.protocol !== "https:") errors.push(`HTTPS olmayan URL: ${entry.url}`);
    if (seen.has(entry.url)) duplicateCount += 1;
    seen.add(entry.url);
    if (blockedPathPrefixes.some((prefix) => parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`))) {
      errors.push(`Gizli alan sitemap'e eklenmiş: ${entry.url}`);
    }
    if (entry.lastModified && Number.isNaN(entry.lastModified.getTime())) {
      errors.push(`Geçersiz güncelleme tarihi: ${entry.url}`);
    }
  }

  if (duplicateCount > 0) errors.push(`${duplicateCount} yinelenen URL bulundu.`);

  return { valid: errors.length === 0, errors, duplicateCount };
}
