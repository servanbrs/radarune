import { NextResponse } from "next/server";

import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";

const fallbackIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#0b1715"/><path d="M32 10 49 44H15L32 10Z" fill="#55e4bf"/><circle cx="32" cy="38" r="4" fill="#0b1715"/></svg>`;

async function resolveTenantWithin(timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      tenantContextService.resolveFromRequest(),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function GET(request: Request) {
  try {
    const tenant = await resolveTenantWithin(1_200);
    const configuredUrl = tenant?.tenantBranding?.faviconUrl;

    if (configuredUrl) {
      const iconUrl = new URL(configuredUrl, request.url);
      if (iconUrl.protocol === "http:" || iconUrl.protocol === "https:") {
        return NextResponse.redirect(iconUrl, {
          status: 307,
          headers: { "Cache-Control": "public, max-age=300" },
        });
      }
    }
  } catch {
    // The fallback keeps the browser tab icon available while the database recovers.
  }

  return new Response(fallbackIcon, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "image/svg+xml",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
