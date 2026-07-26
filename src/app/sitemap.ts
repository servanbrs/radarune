import type { MetadataRoute } from "next";
import { prisma } from "@/server/prisma/prisma";
import { seoUrl } from "@/features/seo/server/seo-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artists, smartLinks] = await Promise.all([
    prisma.artist.findMany({
      where: {
        releaseArtistLinks: { some: { release: { status: "LIVE" } } },
        organization: { tenantStatus: "ACTIVE" },
      },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.smartLink.findMany({
      where: { active: true, organization: { tenantStatus: "ACTIVE" } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: seoUrl("/product"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    ...artists.map((artist) => ({ url: seoUrl(`/artist/${artist.slug}`), lastModified: artist.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...smartLinks.map((link) => ({ url: seoUrl(`/l/${link.slug}`), lastModified: link.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];

  return entries;
}
