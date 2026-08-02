import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import type { DatabaseClient } from "@/server/prisma/database-client";
import type {
  CreatePreSaveCampaignInput,
  CreateSmartLinkInput,
} from "@/features/growth/schemas/growth.schema";

export class GrowthRepository {
  async findArtistAccess(organizationId: string, userId: string, artistId: string) {
    return prisma.artist.findFirst({
      where: {
        id: artistId,
        organizationId,
        OR: [
          { ownerUserId: userId },
          { organization: { memberships: { some: { userId, role: { in: ["OWNER", "ADMIN"] } } } } },
        ],
      },
      select: { id: true, name: true, slug: true, ownerUserId: true },
    });
  }

  async createSmartLink(
    organizationId: string,
    userId: string,
    input: CreateSmartLinkInput,
    client: DatabaseClient = prisma,
  ) {
    return client.smartLink.create({
      data: {
        organizationId,
        ownerUserId: userId,
        artistId: input.artistId,
        releaseId: input.releaseId ?? null,
        title: input.title,
        slug: input.slug,
        description: input.description ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
        ctaText: input.ctaText,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        ogImageUrl: input.ogImageUrl ?? null,
        active: input.active,
        platforms: {
          create: input.platforms.map((platform) => ({
            organizationId,
            platform: platform.platform,
            url: platform.url,
            sortOrder: platform.sortOrder,
            active: platform.active,
            buttonText: platform.buttonText ?? null,
          })),
        },
      },
      select: { id: true, slug: true },
    });
  }

  async updateSmartLink(
    organizationId: string,
    id: string,
    input: CreateSmartLinkInput,
    client: DatabaseClient = prisma,
  ) {
    const result = await client.smartLink.updateMany({
      where: { id, organizationId },
      data: {
        artistId: input.artistId,
        releaseId: input.releaseId ?? null,
        title: input.title,
        slug: input.slug,
        description: input.description ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
        ctaText: input.ctaText,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        ogImageUrl: input.ogImageUrl ?? null,
        active: input.active,
      },
    });
    if (result.count !== 1) return null;
    await client.smartLinkPlatform.deleteMany({ where: { smartLinkId: id, organizationId } });
    if (input.platforms.length > 0) {
      await client.smartLinkPlatform.createMany({
        data: input.platforms.map((platform) => ({
          organizationId,
          smartLinkId: id,
          platform: platform.platform,
          url: platform.url,
          sortOrder: platform.sortOrder,
          active: platform.active,
          buttonText: platform.buttonText ?? null,
        })),
      });
    }
    return client.smartLink.findFirst({ where: { id, organizationId }, select: { id: true, slug: true } });
  }

  async deleteSmartLink(organizationId: string, id: string, client: DatabaseClient = prisma) {
    return client.smartLink.deleteMany({ where: { id, organizationId } });
  }

  async findSmartLinkBySlug(slug: string) {
    return prisma.smartLink.findUnique({
      where: { slug },
      include: {
        artist: true,
        release: true,
        platforms: {
          where: { active: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  }

  async listSmartLinks(organizationId: string) {
    return prisma.smartLink.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { artist: true, release: true, platforms: true },
    });
  }

  async findSmartLinkById(organizationId: string, id: string) {
    return prisma.smartLink.findFirst({
      where: { id, organizationId },
      include: {
        artist: true,
        release: true,
        platforms: { orderBy: { sortOrder: "asc" } },
        _count: { select: { views: true, clicks: true } },
      },
    });
  }

  async recordSmartLinkView(input: {
    organizationId: string;
    smartLinkId: string;
    visitorHash: string;
    ipHash: string;
    userAgent?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }) {
    return prisma.smartLinkView.create({
      data: {
        organizationId: input.organizationId,
        smartLinkId: input.smartLinkId,
        visitorHash: input.visitorHash,
        ipHash: input.ipHash,
        device: input.userAgent?.slice(0, 120) ?? null,
        browser: input.userAgent?.slice(0, 120) ?? null,
        referrer: input.referrer ?? null,
        utmSource: input.utmSource ?? null,
        utmMedium: input.utmMedium ?? null,
        utmCampaign: input.utmCampaign ?? null,
      },
      select: { id: true },
    });
  }

  async recordSmartLinkClick(input: {
    organizationId: string;
    smartLinkId: string;
    platformId: string;
    visitorHash: string;
    ipHash: string;
    userAgent?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const click = await tx.smartLinkClick.create({
        data: {
          organizationId: input.organizationId,
          smartLinkId: input.smartLinkId,
          platformId: input.platformId,
          visitorHash: input.visitorHash,
          ipHash: input.ipHash,
          device: input.userAgent?.slice(0, 120) ?? null,
          referrer: input.referrer ?? null,
          utmSource: input.utmSource ?? null,
          utmMedium: input.utmMedium ?? null,
          utmCampaign: input.utmCampaign ?? null,
        },
        select: { id: true },
      });
      await tx.smartLinkPlatform.update({ where: { id: input.platformId }, data: { clickCount: { increment: 1 } } });
      return click;
    });
  }

  async findPublicSmartLinkPlatform(slug: string, platformId: string) {
    return prisma.smartLinkPlatform.findFirst({
      where: { id: platformId, active: true, smartLink: { slug, active: true } },
      select: { id: true, url: true, organizationId: true, smartLinkId: true },
    });
  }

  async createPreSaveCampaign(
    organizationId: string,
    userId: string,
    input: CreatePreSaveCampaignInput,
    client: DatabaseClient = prisma,
  ) {
    return client.preSaveCampaign.create({
      data: {
        organizationId,
        ownerUserId: userId,
        artistId: input.artistId,
        releaseId: input.releaseId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        releaseDate: input.releaseDate,
        startDate: input.startDate,
        endDate: input.endDate,
        emailCaptureEnabled: input.emailCaptureEnabled,
        marketingConsentText: input.marketingConsentText ?? null,
        successMessage: input.successMessage,
        redirectUrl: input.redirectUrl ?? null,
        active: input.active,
        providers: {
          create: {
            organizationId,
            provider: "EMAIL_REMINDER",
            capabilities: ["EMAIL_CAPTURE"] as Prisma.InputJsonValue,
            active: input.emailCaptureEnabled,
            configurationStatus: "ACTIVE",
          },
        },
      },
      select: { id: true, slug: true },
    });
  }

  async findPreSaveBySlug(slug: string) {
    return prisma.preSaveCampaign.findUnique({
      where: { slug },
      include: { artist: true, release: true, providers: true },
    });
  }

  async listPreSaves(organizationId: string) {
    return prisma.preSaveCampaign.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { artist: true, release: true },
    });
  }

  async findPreSaveById(organizationId: string, id: string) {
    return prisma.preSaveCampaign.findFirst({
      where: { id, organizationId },
      include: {
        artist: true,
        release: true,
        providers: true,
        _count: { select: { subscribers: true, conversions: true } },
      },
    });
  }

  async createPreSaveSubscriber(input: {
    organizationId: string;
    campaignId: string;
    emailNormalized: string;
    emailHash: string;
    marketingConsent: boolean;
    consentText?: string;
    unsubscribeToken: string;
  }) {
    return prisma.preSaveSubscriber.create({
      data: {
        organizationId: input.organizationId,
        campaignId: input.campaignId,
        emailNormalized: input.emailNormalized,
        emailHash: input.emailHash,
        marketingConsent: input.marketingConsent,
        consentText: input.consentText ?? null,
        unsubscribeToken: input.unsubscribeToken,
      },
      select: { id: true },
    });
  }

  async unsubscribe(token: string) {
    return prisma.preSaveSubscriber.update({
      where: { unsubscribeToken: token },
      data: { unsubscribedAt: new Date() },
      select: { id: true, unsubscribedAt: true },
    });
  }

  async findPublicArtist(slug: string) {
    const artist = await prisma.artist.findFirst({
      where: { slug },
      include: {
        releaseArtistLinks: {
          where: { release: { status: { in: ["DISTRIBUTED", "LIVE"] } } },
          include: { release: { include: { _count: { select: { releaseLikes: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 12,
        },
        smartLinks: { where: { active: true }, orderBy: { createdAt: "desc" }, take: 6 },
        artistProfileLinks: { where: { active: true }, orderBy: { sortOrder: "asc" } },
        externalMediaSources: {
          where: { status: "ACTIVE" },
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
          take: 12,
          select: { id: true, provider: true, title: true, artistName: true, externalUrl: true, embedUrl: true, thumbnailUrl: true, publishedAt: true, playable: true, embeddable: true },
        },
        _count: { select: { follows: true } },
      },
    });
    if (!artist) return null;
    const publishedWhere: Prisma.ReleaseArtistWhereInput = { artistId: artist.id, release: { status: { in: ["DISTRIBUTED", "LIVE"] } } };
    const [publishedReleaseCount, totalReleaseVotes] = await Promise.all([
      prisma.releaseArtist.count({ where: publishedWhere }),
      prisma.releaseLike.count({ where: { release: { status: { in: ["DISTRIBUTED", "LIVE"] }, artists: { some: { artistId: artist.id } } } } }),
    ]);
    return { ...artist, publicStats: { publishedReleaseCount, totalReleaseVotes } };
  }

  async findSlugRedirect(oldSlug: string) {
    return prisma.artistSlugHistory.findUnique({ where: { oldSlug } });
  }
}

export const growthRepository = new GrowthRepository();
