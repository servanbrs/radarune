import type { MetadataRoute } from "next";
import { prisma } from "@/server/prisma/prisma";
import { seoUrl } from "@/features/seo/server/seo-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artists, smartLinks, users, playlists, campaigns] = await Promise.all([
    prisma.artist.findMany({
      where: {
        releaseArtistLinks: { some: { release: { status: { in: ["DISTRIBUTED", "LIVE"] } } } },
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
    prisma.user.findMany({
      where: { accountStatus: "ACTIVE", username: { not: null } },
      select: { username: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.playlist.findMany({
      where: { public: true, slug: { not: null } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.preSaveCampaign.findMany({
      where: { active: true, organization: { tenantStatus: "ACTIVE" } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: seoUrl("/"), lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: seoUrl("/discover"), lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: seoUrl("/lists"), lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: seoUrl("/about"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: seoUrl("/contact"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: seoUrl("/privacy"), lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: seoUrl("/terms"), lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: seoUrl("/product"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    ...artists.map((artist) => ({ url: seoUrl(`/artist/${artist.slug}`), lastModified: artist.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...smartLinks.map((link) => ({ url: seoUrl(`/l/${link.slug}`), lastModified: link.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...users.flatMap((user) => user.username ? [{ url: seoUrl(`/u/${user.username}`), lastModified: user.updatedAt, changeFrequency: "weekly" as const, priority: 0.5 }] : []),
    ...playlists.flatMap((playlist) => playlist.slug ? [{ url: seoUrl(`/playlist/${playlist.slug}`), lastModified: playlist.updatedAt, changeFrequency: "weekly" as const, priority: 0.5 }] : []),
    ...campaigns.map((campaign) => ({ url: seoUrl(`/presave/${campaign.slug}`), lastModified: campaign.updatedAt, changeFrequency: "weekly" as const, priority: 0.5 })),
  ];

  return entries;
}
