import "server-only";

import { cookies } from "next/headers";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";
import { normalizeLocale, type Locale } from "@/lib/i18n";

export async function getRequestLocale(): Promise<Locale> {
  const cookieLocale = (await cookies()).get("radarune-locale")?.value;
  if (cookieLocale) return normalizeLocale(cookieLocale);

  try {
    // Locale is optional. If the database pool is saturated, do not make a
    // public page wait for the adapter's full acquire timeout just to choose
    // the default language.
    const tenant = await Promise.race([
      tenantContextService.resolveFromRequest(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1_500)),
    ]);
    return normalizeLocale(tenant?.defaultLocale);
  } catch {
    return "tr-TR";
  }
}
