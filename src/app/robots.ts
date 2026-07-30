import type { MetadataRoute } from "next";
import { seoUrl } from "@/features/seo/server/seo-url";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";
import { prisma } from "@/server/prisma/prisma";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const tenant = await tenantContextService.resolveFromRequest();
  const baseUrl = tenant?.primaryDomain ? `https://${tenant.primaryDomain}` : undefined;
  const indexingSetting = tenant
    ? await prisma.adminSetting.findFirst({ where: { organizationId: tenant.id, key: "SEO_INDEXING_ENABLED" }, select: { value: true } })
    : null;
  const indexingEnabled = indexingSetting?.value !== false && indexingSetting?.value !== "false";
  return {
    rules: {
      userAgent: "*",
      ...(indexingEnabled
        ? { disallow: ["/admin", "/moderator", "/dashboard", "/api", "/install", "/account", "/settings", "/checkout", "/billing", "/uploads", "/private-preview"] }
        : { disallow: ["/"] }),
    },
    sitemap: seoUrl("/sitemap.xml", baseUrl),
  };
}
