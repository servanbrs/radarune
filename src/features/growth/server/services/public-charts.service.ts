import "server-only";

import { unstable_cache } from "next/cache";

import { prisma } from "@/server/prisma/prisma";
import { youtubeAdminCredentialService } from "@/features/integrations/server/services/youtube-admin-credential.service";

export type PublicChartTrack = {
  id: string;
  trackId: string | null;
  releaseId: string | null;
  title: string;
  artistName: string;
  thumbnailUrl: string | null;
  externalUrl: string;
  embedUrl: string | null;
  provider: "YOUTUBE" | "RADARUNE";
  metricLabel: string;
  metricValue: string;
};

export type PublicChartSection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  sourceLabel: string;
  tracks: PublicChartTrack[];
};

type YouTubeVideoResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      channelTitle?: string;
      thumbnails?: {
        maxres?: {
          url?: string;
        };
        standard?: {
          url?: string;
        };
        high?: {
          url?: string;
        };
        medium?: {
          url?: string;
        };
        default?: {
          url?: string;
        };
      };
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function compactNumber(value: string | number | bigint | null | undefined) {
  const numericValue =
    typeof value === "bigint"
      ? Number(value)
      : typeof value === "string"
        ? Number(value)
        : value ?? 0;

  if (!Number.isFinite(numericValue)) {
    return "0";
  }

  return new Intl.NumberFormat("tr-TR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(numericValue);
}

function youtubeThumbnail(
  thumbnails:
    | {
        maxres?: { url?: string };
        standard?: { url?: string };
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      }
    | undefined,
) {
  return (
    thumbnails?.maxres?.url ??
    thumbnails?.standard?.url ??
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    null
  );
}

async function fetchYouTubePopular(
  organizationId: string,
  regionCode?: string,
): Promise<PublicChartTrack[]> {
  const apiKey =
    await youtubeAdminCredentialService.getApiKey(
      organizationId,
    );

  if (!apiKey) {
    return [];
  }

  const params = new URLSearchParams({
    part: "snippet,statistics",
    chart: "mostPopular",
    maxResults: "12",
    videoCategoryId: "10",
    key: apiKey,
  });

  if (regionCode) {
    params.set("regionCode", regionCode);
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 1800,
      },
    },
  );

  if (!response.ok) {
    console.error(
      "YouTube trendleri alınamadı:",
      response.status,
      response.statusText,
    );

    return [];
  }

  const data = (await response.json()) as YouTubeVideoResponse;

  if (!Array.isArray(data.items)) {
    return [];
  }

  return data.items.flatMap((item) => {
    const videoId = item.id;
    const title = item.snippet?.title?.trim();

    if (!videoId || !title) {
      return [];
    }

    return [
      {
        id: `youtube-${regionCode ?? "global"}-${videoId}`,
        trackId: null,
        releaseId: null,
        title,
        artistName:
          item.snippet?.channelTitle?.trim() || "YouTube Music",
        thumbnailUrl: youtubeThumbnail(
          item.snippet?.thumbnails,
        ),
        externalUrl: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        provider: "YOUTUBE" as const,
        metricLabel: "görüntülenme",
        metricValue: compactNumber(
          item.statistics?.viewCount,
        ),
      },
    ];
  });
}

function getTurkeyYouTubeChart(
  organizationId: string,
) {
  return unstable_cache(
    async () =>
      fetchYouTubePopular(organizationId, "TR"),
    [
      "public-youtube-chart-tr-v3",
      organizationId,
    ],
    {
      revalidate: 1800,
      tags: [
        "public-charts",
        "youtube-charts",
        `youtube-charts-${organizationId}`,
      ],
    },
  )();
}

function getGlobalYouTubeChart(
  organizationId: string,
) {
  return unstable_cache(
    async () =>
      fetchYouTubePopular(organizationId),
    [
      "public-youtube-chart-global-v3",
      organizationId,
    ],
    {
      revalidate: 1800,
      tags: [
        "public-charts",
        "youtube-charts",
        `youtube-charts-${organizationId}`,
      ],
    },
  )();
}

const getRadaruneMostLiked = unstable_cache(
  async (): Promise<PublicChartTrack[]> => {
    try {
      const items = await prisma.externalMediaSource.findMany({
        where: {
          status: "ACTIVE",
          playable: true,
        },
        orderBy: [
          {
            likes: {
              _count: "desc",
            },
          },
          {
            createdAt: "desc",
          },
        ],
        take: 12,
        select: {
          id: true,
          trackId: true,
          releaseId: true,
          title: true,
          artistName: true,
          thumbnailUrl: true,
          externalUrl: true,
          embedUrl: true,
          provider: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      return items.map((item) => ({
        id: `radarune-liked-${item.id}`,
        trackId: item.trackId,
        releaseId: item.releaseId,
        title: item.title,
        artistName:
          item.artistName?.trim() || "Bilinmeyen sanatçı",
        thumbnailUrl:
          item.thumbnailUrl ??
          (item.releaseId
            ? `/api/public/v1/releases/${item.releaseId}/artwork`
            : null),
        externalUrl: item.externalUrl,
        embedUrl: item.embedUrl,
        provider: "RADARUNE",
        metricLabel: "beğeni",
        metricValue: compactNumber(item._count.likes),
      }));
    } catch (error) {
      console.error(
        "Radarune beğeni listesi hazırlanamadı:",
        error,
      );

      return [];
    }
  },
  ["public-radarune-most-liked-v2"],
  {
    revalidate: 300,
    tags: ["public-charts", "radarune-charts"],
  },
);

const getRadaruneMostDiscussed = unstable_cache(
  async (): Promise<PublicChartTrack[]> => {
    try {
      const items = await prisma.externalMediaSource.findMany({
        where: {
          status: "ACTIVE",
          playable: true,
        },
        orderBy: [
          {
            comments: {
              _count: "desc",
            },
          },
          {
            createdAt: "desc",
          },
        ],
        take: 12,
        select: {
          id: true,
          trackId: true,
          releaseId: true,
          title: true,
          artistName: true,
          thumbnailUrl: true,
          externalUrl: true,
          embedUrl: true,
          _count: {
            select: {
              comments: true,
            },
          },
        },
      });

      return items.map((item) => ({
        id: `radarune-discussed-${item.id}`,
        trackId: item.trackId,
        releaseId: item.releaseId,
        title: item.title,
        artistName:
          item.artistName?.trim() || "Bilinmeyen sanatçı",
        thumbnailUrl:
          item.thumbnailUrl ??
          (item.releaseId
            ? `/api/public/v1/releases/${item.releaseId}/artwork`
            : null),
        externalUrl: item.externalUrl,
        embedUrl: item.embedUrl,
        provider: "RADARUNE",
        metricLabel: "yorum",
        metricValue: compactNumber(item._count.comments),
      }));
    } catch (error) {
      console.error(
        "Radarune yorum listesi hazırlanamadı:",
        error,
      );

      return [];
    }
  },
  ["public-radarune-most-discussed-v2"],
  {
    revalidate: 300,
    tags: ["public-charts", "radarune-charts"],
  },
);

const getRadaruneNewReleases = unstable_cache(
  async (): Promise<PublicChartTrack[]> => {
    try {
      const items = await prisma.externalMediaSource.findMany({
        where: {
          status: "ACTIVE",
          playable: true,
        },
        orderBy: {
          publishedAt: "desc",
        },
        take: 12,
        select: {
          id: true,
          trackId: true,
          releaseId: true,
          title: true,
          artistName: true,
          thumbnailUrl: true,
          externalUrl: true,
          embedUrl: true,
          publishedAt: true,
          createdAt: true,
        },
      });

      return items.map((item) => {
        const date = item.publishedAt ?? item.createdAt;

        return {
          id: `radarune-new-${item.id}`,
          trackId: item.trackId,
          releaseId: item.releaseId,
          title: item.title,
          artistName:
            item.artistName?.trim() || "Bilinmeyen sanatçı",
          thumbnailUrl:
            item.thumbnailUrl ??
            (item.releaseId
              ? `/api/public/v1/releases/${item.releaseId}/artwork`
              : null),
          externalUrl: item.externalUrl,
          embedUrl: item.embedUrl,
          provider: "RADARUNE",
          metricLabel: "yayın tarihi",
          metricValue: new Intl.DateTimeFormat("tr-TR", {
            day: "2-digit",
            month: "short",
          }).format(date),
        };
      });
    } catch (error) {
      console.error(
        "Radarune yeni yayın listesi hazırlanamadı:",
        error,
      );

      return [];
    }
  },
  ["public-radarune-new-releases-v2"],
  {
    revalidate: 300,
    tags: ["public-charts", "radarune-charts"],
  },
);

class PublicChartsService {
  async getPublicCharts(
    organizationId: string,
  ): Promise<PublicChartSection[]> {
    const results = await Promise.allSettled([
      getTurkeyYouTubeChart(organizationId),
      getGlobalYouTubeChart(organizationId),
      getRadaruneMostLiked(),
      getRadaruneMostDiscussed(),
      getRadaruneNewReleases(),
    ]);

    const [
      turkeyResult,
      globalResult,
      mostLikedResult,
      mostDiscussedResult,
      newestResult,
    ] = results;

    if (turkeyResult.status === "rejected") {
      console.error(
        "Türkiye YouTube listesi alınamadı:",
        turkeyResult.reason,
      );
    }

    if (globalResult.status === "rejected") {
      console.error(
        "Global YouTube listesi alınamadı:",
        globalResult.reason,
      );
    }

    const turkey =
      turkeyResult.status === "fulfilled"
        ? turkeyResult.value
        : [];

    const global =
      globalResult.status === "fulfilled"
        ? globalResult.value
        : [];

    const mostLiked =
      mostLikedResult.status === "fulfilled"
        ? mostLikedResult.value
        : [];

    const mostDiscussed =
      mostDiscussedResult.status === "fulfilled"
        ? mostDiscussedResult.value
        : [];

    const newest =
      newestResult.status === "fulfilled"
        ? newestResult.value
        : [];

    return [
      {
        id: "youtube-turkey",
        eyebrow: "YOUTUBE / TÜRKİYE",
        title: "Türkiye şu an ne dinliyor?",
        description:
          "YouTube Music kategorisinde Türkiye'de öne çıkan güncel videolar.",
        sourceLabel: "YouTube Data API",
        tracks: turkey,
      },
      {
        id: "radarune-most-liked",
        eyebrow: "RADARUNE / TOPLULUK",
        title: "Topluluğun favorileri",
        description:
          "Radarune kullanıcılarının en çok beğendiği aktif yayınlar.",
        sourceLabel: "Radarune gerçek verisi",
        tracks: mostLiked,
      },
      {
        id: "youtube-global",
        eyebrow: "YOUTUBE / GLOBAL",
        title: "Dünyadan yükselenler",
        description:
          "YouTube'un bölge belirtilmeden sunduğu güncel müzik trendleri.",
        sourceLabel: "YouTube Data API",
        tracks: global,
      },
      {
        id: "radarune-most-discussed",
        eyebrow: "RADARUNE / GÜNDEM",
        title: "En çok konuşulanlar",
        description:
          "Toplulukta en fazla yorum alan aktif şarkılar.",
        sourceLabel: "Radarune gerçek verisi",
        tracks: mostDiscussed,
      },
      {
        id: "radarune-new",
        eyebrow: "RADARUNE / YENİ",
        title: "Yeni keşifler",
        description:
          "Radarune'a en son eklenen ve dinlemeye açık yayınlar.",
        sourceLabel: "Radarune kataloğu",
        tracks: newest,
      },
    ];
  }
}

export const publicChartsService = new PublicChartsService();
