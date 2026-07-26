import { NextResponse } from "next/server";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";
import { siteBuilderService } from "@/features/platform/server/services/site-builder.service";
import { prisma } from "@/server/prisma/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const tenant = await tenantContextService.resolveFromRequest();
  if (!tenant) return NextResponse.json({ error: "Tenant bulunamadı." }, { status: 404 });
  const page = await siteBuilderService.getHomepage(tenant.id);
  const theme = await prisma.themeConfig.findFirst({ where: { organizationId: tenant.id, draft: false } }).catch(() => null);
  return NextResponse.json({
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      locale: tenant.defaultLocale,
      currency: tenant.defaultCurrency,
      timezone: tenant.defaultTimezone,
    },
    branding: tenant.tenantBranding,
    theme,
    homepage: page,
    discover: tenant.discoverConfig,
  }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
