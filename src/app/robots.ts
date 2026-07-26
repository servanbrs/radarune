import type { MetadataRoute } from "next";
import { seoUrl } from "@/features/seo/server/seo-url";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const tenant = await tenantContextService.resolveFromRequest();
  const baseUrl = tenant?.primaryDomain ? `https://${tenant.primaryDomain}` : undefined;
  return {
    rules: {
      userAgent: "*",
      disallow: ["/admin", "/moderator", "/dashboard", "/api", "/install", "/account", "/settings", "/checkout", "/billing", "/uploads", "/private-preview"],
    },
    sitemap: seoUrl("/sitemap.xml", baseUrl),
  };
}
