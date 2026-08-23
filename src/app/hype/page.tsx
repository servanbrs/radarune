import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowUpRight,
  Flame,
  Heart,
  Medal,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import { TrackPlayButton } from "@/features/growth/components/track-play-button";
import { PublicArtworkImage } from "@/features/releases/components/public-artwork-image";
import { publicReleaseArtworkUrl } from "@/features/releases/lib/public-artwork-url";
import type { DiscoverFeedItem } from "@/features/growth/server/services/discover.service";
import {
  discoverService,
  getCachedPublicDiscoverFeed,
} from "@/features/growth/server/services/discover.service";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";
import { getRequestLocale } from "@/lib/i18n-server";
import { localize, normalizeLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const PUBLIC_QUERY_TIMEOUT_MS = 2500;

async function resolveWithin<T>(
  promise: Promise<T>,
  timeoutMs = PUBLIC_QUERY_TIMEOUT_MS,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } catch {
    // Public pages must remain usable when an optional session lookup fails.
    // Treat the visitor as anonymous and let the public feed render.
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const metadata: Metadata = {
  title: "Hype | Radarune topluluk sıralaması",
  description:
    "Radarune topluluğunda en çok oy ve etkileşim alan ilk 100 şarkıyı keşfet.",
  alternates: { canonical: "/hype" },
  openGraph: {
    title: "Hype | Radarune topluluk sıralaması",
    description:
      "En çok oy ve etkileşim alan Radarune şarkılarını keşfet.",
    url: "/hype",
    type: "website",
  },
};

function artworkUrl(item: DiscoverFeedItem) {
  if (item.sourceType === "RADARUNE" && item.releaseId) {
    return publicReleaseArtworkUrl(item.releaseId, item.artworkVersion);
  }

  return item.thumbnailUrl;
}

function hypeScore(item: DiscoverFeedItem) {
  return (item.likeCount ?? 0) * 100 + item.score;
}

function artistHref(item: DiscoverFeedItem) {
  return item.artist?.slug ? `/artist/${item.artist.slug}` : "/discover";
}

function itemHref(item: DiscoverFeedItem) {
  if (item.trackId) return `/track/${item.trackId}`;
  if (item.releaseId) return `/release/${item.releaseId}`;
  return item.externalUrl ?? "/discover";
}

function LeaderCard({
  item,
  rank,
  locale = "tr-TR",
}: {
  item: DiscoverFeedItem;
  rank: number;
  locale?: string;
}) {
  const image = artworkUrl(item);

  return (
    <article
      className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#13201e] p-4 text-white shadow-[0_18px_50px_rgba(4,15,13,0.24)] ${rank === 1 ? "sm:col-span-2 lg:col-span-1" : ""}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-[#23312f]">
        {image ? (
          <PublicArtworkImage
            alt=""
            className="size-full object-cover"
            loading={rank === 1 ? "eager" : "lazy"}
            src={image}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-orange-300/35 to-emerald-300/10">
            <Medal className="size-14 text-orange-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex size-11 items-center justify-center rounded-2xl bg-orange-300 text-lg font-black text-[#201207] shadow-lg">
          {rank}
        </span>
        <div className="absolute inset-x-4 bottom-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-200">
            {rank === 1 ? localize(locale, { tr: "Haftanın zirvesi", en: "Top of the week", de: "Spitze der Woche" }) : `${localize(locale, { tr: "İlk", en: "Top", de: "Top" })} ${rank}`}
          </p>
          <Link
            className="mt-1 line-clamp-2 text-xl font-black tracking-[-0.04em] hover:text-orange-200 sm:text-2xl"
            href={itemHref(item)}
          >
            {item.title}
          </Link>
          <p className="mt-1 truncate text-sm text-white/65">
            {item.artist?.name ?? item.artistName}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 text-orange-200">
          <Heart className="size-4 fill-current" />
          {item.likeCount ?? 0} {localize(locale, { tr: "oy", en: "votes", de: "Stimmen" })}
        </span>
        {item.trackId ? <TrackPlayButton trackId={item.trackId} className="size-9 bg-white text-[#101817] hover:bg-orange-200" /> : null}
        <Link
          className="inline-flex items-center gap-1 font-bold text-emerald-300 hover:text-white"
          href={artistHref(item)}
        >
          {localize(locale, { tr: "Profili aç", en: "Open profile", de: "Profil öffnen" })} <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

export default async function HypePage() {
  const locale = normalizeLocale(await getRequestLocale());
  const [session, tenant] = await Promise.all([
    resolveWithin(authSessionService.getOptionalSession()),
    resolveWithin(tenantContextService.resolveFromRequest()),
  ]);
  const feed = await resolveWithin(
    session
      ? discoverService.getFeed(undefined, tenant?.id)
      : getCachedPublicDiscoverFeed(tenant?.id),
  ) ?? [];
  const ranking = [...feed].sort(
    (left, right) =>
      hypeScore(right) - hypeScore(left) ||
      (right.likeCount ?? 0) - (left.likeCount ?? 0),
  );
  const leaders = ranking.slice(0, 3);
  const currentUser = session
    ? {
        name: session.user.name,
        username:
          "username" in session.user &&
          typeof session.user.username === "string"
            ? session.user.username
            : null,
      }
    : null;
  const artistCount = new Set(
    ranking.map((item) => item.artist?.id).filter(Boolean),
  ).size;
  const totalVotes = ranking.reduce(
    (total, item) => total + (item.likeCount ?? 0),
    0,
  );

  return (
    <PublicGrowthShell currentUser={currentUser} locale={locale}>
      <div className="min-w-0 overflow-hidden rounded-[2.4rem] bg-[#080f12] text-white shadow-[0_30px_100px_rgba(4,15,13,0.24)]">
        <section className="relative overflow-hidden px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
          <div aria-hidden className="pointer-events-none absolute -left-24 -top-40 size-[480px] rounded-full bg-orange-400/20 blur-[110px]" />
          <div aria-hidden className="pointer-events-none absolute -right-20 top-20 size-[420px] rounded-full bg-emerald-400/15 blur-[110px]" />
          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-orange-300/25 bg-orange-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-orange-200">
                <Flame className="size-3.5" /> Radarune Hype
              </p>
              <h1 className="mt-6 max-w-3xl break-words text-4xl font-black tracking-[-0.06em] sm:text-7xl">
                {localize(locale, { tr: "Zirvedekiler.", en: "At the top.", de: "An der Spitze." })}
                <span className="block text-orange-300">{localize(locale, { tr: "Herkes dinlemeden önce.", en: "Before everyone listens.", de: "Bevor alle zuhören." })}</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/55">
                {localize(locale, { tr: "Oylar ve topluluk etkileşimi birlikte hesaplanır. En yüksek Hype puanına sahip yayın 1. sıraya çıkar.", en: "Votes and community engagement are combined. The release with the highest Hype score reaches number one.", de: "Stimmen und Community-Interaktionen werden kombiniert. Der Release mit dem höchsten Hype-Score landet auf Platz eins." })}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:min-w-[360px]">
              <div className="rounded-2xl bg-white/[0.06] p-3"><p className="text-2xl font-black text-orange-300">{ranking.length}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">{localize(locale, { tr: "Sıralanan", en: "Ranked", de: "Gerankt" })}</p></div>
              <div className="rounded-2xl bg-white/[0.06] p-3"><p className="text-2xl font-black text-emerald-300">{artistCount}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">{localize(locale, { tr: "Sanatçı", en: "Artists", de: "Künstler" })}</p></div>
              <div className="rounded-2xl bg-white/[0.06] p-3"><p className="text-2xl font-black">{totalVotes}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">{localize(locale, { tr: "Toplam oy", en: "Total votes", de: "Stimmen gesamt" })}</p></div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/10 bg-[#f5f8f6] px-4 py-8 text-[#101817] sm:px-8 sm:py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-700">{localize(locale, { tr: "Top 3 / Liderlik tablosu", en: "Top 3 / Leaderboard", de: "Top 3 / Rangliste" })}</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">{localize(locale, { tr: "Bu haftanın yıldızları", en: "This week’s stars", de: "Die Stars der Woche" })}</h2>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#74807b]"><Sparkles className="size-4 text-orange-600" />{localize(locale, { tr: "Oy + etkileşim skoru", en: "Votes + engagement score", de: "Stimmen + Engagement-Score" })}</span>
          </div>

          {leaders.length ? (
            <div className="grid gap-4 md:grid-cols-3">
              {leaders.map((item, index) => <LeaderCard item={item} key={item.id} locale={locale} rank={index + 1} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-black/15 p-8 text-sm text-[#74807b]">{localize(locale, { tr: "Hype sıralaması için henüz yeterli yayın verisi yok.", en: "There are not enough releases for a Hype ranking yet.", de: "Für ein Hype-Ranking gibt es noch nicht genug Releases." })}</div>
          )}

          <div className="mt-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-700">Radarune global chart</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">{localize(locale, { tr: "İlk 100", en: "Top 100", de: "Top 100" })}</h2>
            </div>
            <span className="text-xs font-semibold text-[#74807b]">{localize(locale, { tr: "En çok oy ve etkileşim alanlar", en: "Most votes and engagement", de: "Die meisten Stimmen und Interaktionen" })}</span>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-black/[0.07] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            {ranking.map((item, index) => (
              <div className="flex min-w-0 items-center gap-3 border-b border-black/[0.06] px-3 py-3 last:border-b-0 sm:gap-4 sm:px-5" key={item.id}>
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${index < 3 ? "bg-orange-100 text-orange-800" : "bg-[#f0f5f3] text-[#74807b]"}`}>{String(index + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <Link className="truncate font-bold hover:text-orange-700" href={itemHref(item)}>
                    {item.title}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-[#74807b]">{item.artist?.name ?? item.artistName} · {item.primaryGenre}</p>
                </div>
                <div className="hidden shrink-0 items-center gap-1 text-xs text-[#74807b] sm:flex"><Heart className="size-3.5 text-orange-600" />{item.likeCount ?? 0}</div>
                <span className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-emerald-700 md:inline-flex"><TrendingUp className="size-3.5" />{Math.round(hypeScore(item))}</span>
                {item.trackId ? <TrackPlayButton trackId={item.trackId} className="size-8 bg-[#101817] text-white hover:bg-orange-300 hover:text-[#101817]" /> : null}
                <Link aria-label={`${item.title} sanatçı profili`} className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[#087d70] hover:bg-[#e9faf4]" href={artistHref(item)}><ArrowUpRight className="size-4" /></Link>
              </div>
            ))}
            {!ranking.length ? <p className="p-8 text-sm text-[#74807b]">{localize(locale, { tr: "Henüz sıralanacak yayın bulunmuyor.", en: "There are no releases to rank yet.", de: "Es gibt noch keine Releases zum Ranken." })}</p> : null}
          </div>
        </section>
      </div>
    </PublicGrowthShell>
  );
}
