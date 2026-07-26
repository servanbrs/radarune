import { env } from "@/lib/env";

export function seoBaseUrl() {
  return env.SEO_CANONICAL_BASE_URL ?? env.NEXT_PUBLIC_APP_URL;
}

export function seoUrl(path: string, baseUrl?: string) {
  return new URL(path, baseUrl ?? seoBaseUrl()).toString();
}
