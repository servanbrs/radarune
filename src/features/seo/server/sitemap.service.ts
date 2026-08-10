import { prisma } from "@/server/prisma/prisma";
import { seoUrl } from "@/features/seo/server/seo-url";

export const sitemapKinds = [
  "static",
  "artists",
  "smart-links",
  "playlists",
  "presaves",
] as const;

export type SitemapKind = (typeof sitemapKinds)[number];

export type SitemapEntry = {
  url: string;
  lastModified?: Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

const staticEntryDefinitions: Array<[
  string,
  NonNullable<SitemapEntry["changeFrequency"]>,
  number,
]> = [
  ["/", "daily", 1],
  ["/discover", "daily", 0.9],
  ["/lists", "daily", 0.8],
  ["/hype", "hourly", 0.85],
  ["/about", "monthly", 0.5],
  ["/contact", "monthly", 0.5],
  ["/privacy", "yearly", 0.3],
  ["/terms", "yearly", 0.3],
  ["/sign-in", "monthly", 0.4],
  ["/sign-up", "monthly", 0.5],
  ["/product", "monthly", 0.8],
];

const staticEntries: SitemapEntry[] = staticEntryDefinitions.map(([path, changeFrequency, priority]) => ({
  url: seoUrl(path),
  lastModified: new Date(),
  changeFrequency,
  priority,
}));

export async function getSitemapEntries(kind: SitemapKind): Promise<SitemapEntry[]> {
  if (kind === "static") return staticEntries;

  if (kind === "artists") {
    const artists = await prisma.artist.findMany({
      where: {
        organization: { tenantStatus: "ACTIVE" },
        OR: [
          { profilePublishedAt: { not: null } },
          { releaseArtistLinks: { some: { release: { status: { in: ["DISTRIBUTED", "LIVE"] } } } } },
        ],
      },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    return artists.map((artist) => ({
      url: seoUrl(`/artist/${encodeURIComponent(artist.slug)}`),
      lastModified: artist.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  }

  if (kind === "smart-links") {
    const links = await prisma.smartLink.findMany({
      where: { active: true, organization: { tenantStatus: "ACTIVE" } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    return links.map((link) => ({
      url: seoUrl(`/l/${encodeURIComponent(link.slug)}`),
      lastModified: link.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  }

  if (kind === "playlists") {
    const playlists = await prisma.playlist.findMany({
      where: { public: true, slug: { not: null } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    return playlists.flatMap((playlist) => playlist.slug ? [{
      url: seoUrl(`/playlist/${encodeURIComponent(playlist.slug)}`),
      lastModified: playlist.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }] : []);
  }

  const campaigns = await prisma.preSaveCampaign.findMany({
    where: { active: true, organization: { tenantStatus: "ACTIVE" } },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return campaigns.map((campaign) => ({
    url: seoUrl(`/presave/${encodeURIComponent(campaign.slug)}`),
    lastModified: campaign.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }));
}

export async function getAllSitemapEntries() {
  const entries: SitemapEntry[] = [];
  for (const kind of sitemapKinds) {
    entries.push(...await getSitemapEntries(kind));
  }
  return entries;
}

export function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function renderUrlSet(entries: SitemapEntry[]) {
  const body = entries.map((entry) => [
    "<url>",
    `<loc>${xmlEscape(entry.url)}</loc>`,
    entry.lastModified ? `<lastmod>${entry.lastModified.toISOString()}</lastmod>` : "",
    entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : "",
    typeof entry.priority === "number" ? `<priority>${entry.priority.toFixed(1)}</priority>` : "",
    "</url>",
  ].filter(Boolean).join(""));

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body.join("")}</urlset>`;
}

export function renderSitemapIndex(kinds: SitemapKind[]) {
  const body = kinds.map((kind) => `<sitemap><loc>${xmlEscape(seoUrl(`/sitemaps/${kind}.xml`))}</loc></sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}
