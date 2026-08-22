import "server-only";

import { unstable_cache } from "next/cache";

import { prisma } from "@/server/prisma/prisma";
import { youtubeAdminCredentialService } from "@/features/integrations/server/services/youtube-admin-credential.service";
import { publicReleaseArtworkUrl } from "@/features/releases/lib/public-artwork-url";

const CHART_QUERY_TIMEOUT_MS = 4_000;

async function withTimeout<T>(
  task: Promise<T>,
  fallback: T,
  label: string,
  timeoutMs = CHART_QUERY_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      task,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => {
          console.warn(`[PUBLIC_CHARTS] ${label} zaman aşımına uğradı.`);
          resolve(fallback);
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    console.error(`[PUBLIC_CHARTS] ${label} hazırlanamadı:`, error);
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

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
        : (value ?? 0);

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
  apiKey: string,
  regionCode?: string,
): Promise<PublicChartTrack[]> {
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

  // A slow provider must never hold the public /lists page open. The chart
  // is optional; Radarune's own cached sections can render without it.
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(2_500),
      next: {
        revalidate: 1800,
      },
    },
  ).catch((error) => {
    console.warn("YouTube trendleri zaman aşımına uğradı:", error);
    return null;
  });

  if (!response) {
    return [];
  }

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
        artistName: item.snippet?.channelTitle?.trim() || "YouTube Music",
        thumbnailUrl: youtubeThumbnail(item.snippet?.thumbnails),
        externalUrl: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        provider: "YOUTUBE" as const,
        metricLabel: "görüntülenme",
        metricValue: compactNumber(item.statistics?.viewCount),
      },
    ];
  });
}

type RadaruneChartItem = {
  id: string;
  trackId: string | null;
  releaseId: string | null;
  title: string;
  artistName: string | null;
  thumbnailUrl: string | null;
  externalUrl: string;
  embedUrl: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    likes: number;
    comments: number;
  };
};

const getRadaruneChartItems = unstable_cache(
  async (): Promise<RadaruneChartItem[]> => {
    try {
      // One bounded query feeds all three Radarune lists. The previous
      // implementation opened three independent queries per page request;
      // on mobile retries that could exhaust the production connection pool.
      return await prisma.externalMediaSource.findMany({
        where: {
          status: "ACTIVE",
          playable: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 48,
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
          updatedAt: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Radarune liste verisi hazırlanamadı:", error);
      return [];
    }
  },
  ["public-radarune-chart-items-v3"],
  {
    revalidate: 300,
    tags: ["public-charts", "radarune-charts"],
  },
);

function toRadaruneTrack(
  item: RadaruneChartItem,
  metricLabel: string,
  metricValue: string,
): PublicChartTrack {
  return {
    id: `radarune-${item.id}-${metricLabel}`,
    trackId: item.trackId,
    releaseId: item.releaseId,
    title: item.title,
    artistName: item.artistName?.trim() || "Bilinmeyen sanatçı",
    thumbnailUrl:
      item.thumbnailUrl ??
      (item.releaseId
        ? publicReleaseArtworkUrl(item.releaseId, item.updatedAt)
        : null),
    externalUrl: item.externalUrl,
    embedUrl: item.embedUrl,
    provider: "RADARUNE",
    metricLabel,
    metricValue,
  };
}

class PublicChartsService {
  private readonly inFlight = new Map<string, Promise<PublicChartSection[]>>();

  async getPublicCharts(organizationId: string): Promise<PublicChartSection[]> {
    const existing = this.inFlight.get(organizationId);
    if (existing) return existing;

    const pending = this.loadPublicCharts(organizationId).finally(() => {
      if (this.inFlight.get(organizationId) === pending) {
        this.inFlight.delete(organizationId);
      }
    });

    this.inFlight.set(organizationId, pending);
    return pending;
  }

  private async loadPublicCharts(
    organizationId: string,
  ): Promise<PublicChartSection[]> {
    // Do not let a single slow MariaDB query keep the public page in a
    // loading state for the adapter's 30-second acquire timeout. The chart
    // sections are optional and can be filled on the next cached refresh.
    const apiKey = await withTimeout(
      youtubeAdminCredentialService.getApiKey(organizationId),
      null,
      "YouTube bağlantısı",
      1_500,
    );

    const [turkey, global, radaruneItems] = await Promise.all([
      apiKey
        ? withTimeout(
            fetchYouTubePopular(apiKey, "TR"),
            [],
            "Türkiye YouTube listesi",
            3_000,
          )
        : Promise.resolve([]),
      apiKey
        ? withTimeout(
            fetchYouTubePopular(apiKey),
            [],
            "Global YouTube listesi",
            3_000,
          )
        : Promise.resolve([]),
      withTimeout(
        getRadaruneChartItems(),
        [],
        "Radarune liste verisi",
        3_000,
      ),
    ]);

    const mostLiked = [...radaruneItems]
      .sort((a, b) => b._count.likes - a._count.likes)
      .slice(0, 12)
      .map((item) => toRadaruneTrack(item, "beğeni", compactNumber(item._count.likes)));
    const mostDiscussed = [...radaruneItems]
      .sort((a, b) => b._count.comments - a._count.comments)
      .slice(0, 12)
      .map((item) => toRadaruneTrack(item, "yorum", compactNumber(item._count.comments)));
    const newest = [...radaruneItems]
      .sort(
        (a, b) =>
          (b.publishedAt ?? b.createdAt).getTime() -
          (a.publishedAt ?? a.createdAt).getTime(),
      )
      .slice(0, 12)
      .map((item) =>
        toRadaruneTrack(
          item,
          "yayın tarihi",
          new Intl.DateTimeFormat("tr-TR", {
            day: "2-digit",
            month: "short",
          }).format(item.publishedAt ?? item.createdAt),
        ),
      );

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
        description: "Toplulukta en fazla yorum alan aktif şarkılar.",
        sourceLabel: "Radarune gerçek verisi",
        tracks: mostDiscussed,
      },
      {
        id: "radarune-new",
        eyebrow: "RADARUNE / YENİ",
        title: "Yeni keşifler",
        description: "Radarune'a en son eklenen ve dinlemeye açık yayınlar.",
        sourceLabel: "Radarune kataloğu",
        tracks: newest,
      },
    ];
  }
}

export const publicChartsService = new PublicChartsService();
