import { getSitemapEntries, renderUrlSet } from "@/features/seo/server/sitemap.service";
import { sitemapXmlResponse } from "@/features/seo/server/sitemap-http";

export const dynamic = "force-dynamic";

export async function GET() {
  return sitemapXmlResponse(renderUrlSet(await getSitemapEntries("smart-links")));
}
