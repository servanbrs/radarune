import Link from "next/link";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { ArrowDown, Globe2, Radio, Sparkles, TrendingUp } from "lucide-react";

import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { PublicCharts } from "@/features/growth/components/public-charts";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import { publicChartsService } from "@/features/growth/server/services/public-charts.service";
import { prisma } from "@/server/prisma/prisma";
import { getRequestLocale } from "@/lib/i18n-server";
import { localize } from "@/lib/i18n";

export const dynamic = "force-dynamic";

async function withTimeout<T>(
  task: Promise<T>,
  fallback: T,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      task,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch {
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const metadata: Metadata = {
  title: "Müzik Listeleri | Radarune",
  description:
    "YouTube Türkiye trendleri, global müzik gündemi ve Radarune topluluğunun yükselen şarkıları.",
  alternates: { canonical: "/lists" },
  openGraph: {
    title: "Müzik Listeleri | Radarune",
    description:
      "Türkiye, global ve Radarune topluluğunun yükselen müzik listelerini keşfet.",
    url: "/lists",
    type: "website",
  },
};

const getPublicOrganizationId = unstable_cache(
  async () => {
    const organization = await prisma.organization.findFirst({
      where: { tenantStatus: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    return organization?.id ?? null;
  },
  ["public-lists-organization-id"],
  { revalidate: 60, tags: ["public-charts"] },
);

const quickLinks = [
  {
    href: "#youtube-turkey",
    label: { tr: "Türkiye", en: "Turkey", de: "Türkei" },
    icon: Radio,
  },
  {
    href: "#radarune-most-liked",
    label: { tr: "Topluluk", en: "Community", de: "Community" },
    icon: TrendingUp,
  },
  {
    href: "#youtube-global",
    label: { tr: "Global", en: "Global", de: "Global" },
    icon: Globe2,
  },
  {
    href: "#radarune-new",
    label: { tr: "Yeni çıkanlar", en: "New releases", de: "Neu erschienen" },
    icon: Sparkles,
  },
];

export default async function ListsPage() {
  const [locale, session, cachedOrganizationId] = await Promise.all([
    getRequestLocale(),
    withTimeout(authSessionService.getOptionalSession(), null, 1_500),
    withTimeout(getPublicOrganizationId(), null, 3_000),
  ]);

  let organizationId: string | null = cachedOrganizationId;

  if (session) {
    const membership = await withTimeout(
      prisma.organizationMembership.findFirst({
        where: {
          userId: session.user.id,
          status: "ACTIVE",
          organization: {
            tenantStatus: "ACTIVE",
          },
        },
        orderBy: [
          {
            role: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
        select: {
          organizationId: true,
        },
      }),
      null,
      1_500,
    );

    organizationId = membership?.organizationId ?? cachedOrganizationId;
  }

  const sections = organizationId
    ? await publicChartsService.getPublicCharts(organizationId)
    : [];

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

  const totalTracks = sections.reduce(
    (total, section) => total + section.tracks.length,
    0,
  );

  return (
    <PublicGrowthShell currentUser={currentUser} locale={locale}>
      <div className="min-w-0 space-y-6">
        <section className="relative overflow-hidden rounded-[2.4rem] bg-[#071612] px-6 py-10 text-white shadow-[0_30px_100px_rgba(4,24,20,0.25)] sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          <div className="pointer-events-none absolute -right-28 -top-36 size-[420px] rounded-full bg-[#18d7aa]/20 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-48 left-[25%] size-[390px] rounded-full bg-blue-400/10 blur-[100px]" />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.65fr)] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#54e7c2]">
                RADARUNE /{" "}
                {localize(locale, {
                  tr: "LİSTELER",
                  en: "CHARTS",
                  de: "LISTEN",
                })}
              </p>

              <h1 className="mt-5 max-w-4xl break-words text-4xl font-black tracking-[-0.055em] sm:text-6xl lg:text-8xl">
                {localize(locale, {
                  tr: "Müziğin nabzı",
                  en: "The pulse of music",
                  de: "Der Puls der Musik",
                })}
                <span className="block text-[#54e7c2]">
                  {localize(locale, {
                    tr: "burada atıyor.",
                    en: "beats right here.",
                    de: "schlägt hier.",
                  })}
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
                {localize(locale, {
                  tr: "Türkiye trendlerini, dünyadan yükselen şarkıları ve Radarune topluluğunun gerçek etkileşimleriyle öne çıkan yayınları keşfet.",
                  en: "Discover Turkey’s trends, rising global songs and releases powered by real Radarune community engagement.",
                  de: "Entdecke Trends aus der Türkei, aufsteigende globale Songs und Releases mit echtem Radarune-Community-Engagement.",
                })}
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {quickLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#54e7c2]/40 hover:bg-[#54e7c2]/10"
                      href={item.href}
                      key={item.href}
                    >
                      <Icon className="size-4 text-[#54e7c2]" />
                      {localize(locale, item.label)}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                <p className="text-4xl font-black text-[#54e7c2]">
                  {sections.length}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                  {localize(locale, {
                    tr: "Güncel liste",
                    en: "Live charts",
                    de: "Aktuelle Liste",
                  })}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                <p className="text-4xl font-black">{totalTracks}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                  {localize(locale, {
                    tr: "Öne çıkan içerik",
                    en: "Featured content",
                    de: "Highlights",
                  })}
                </p>
              </div>

              <div className="col-span-2 rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                <p className="text-sm font-bold">
                  {localize(locale, {
                    tr: "Gerçek ve güncel veri",
                    en: "Fresh, real data",
                    de: "Echte, aktuelle Daten",
                  })}
                </p>

                <p className="mt-2 text-xs leading-5 text-white/45">
                  {localize(locale, {
                    tr: "YouTube listeleri 30 dakika, Radarune topluluk verileri 5 dakika önbellekte tutulur.",
                    en: "YouTube charts are cached for 30 minutes; Radarune community data for 5 minutes.",
                    de: "YouTube-Listen werden 30 Minuten, Radarune-Community-Daten 5 Minuten zwischengespeichert.",
                  })}
                </p>
              </div>
            </div>
          </div>

          <a
            aria-label={localize(locale, {
              tr: "Listelere git",
              en: "Go to charts",
              de: "Zu den Listen",
            })}
            className="absolute bottom-5 right-6 hidden size-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-white/70 transition hover:bg-white hover:text-black sm:flex"
            href="#youtube-turkey"
          >
            <ArrowDown className="size-5" />
          </a>
        </section>

        <PublicCharts sections={sections} locale={locale} />

        <section className="rounded-[2rem] border border-black/[0.06] bg-[#e9faf4] p-7 sm:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#087d70]">
                RADARUNE DISCOVER
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-black">
                {localize(locale, {
                  tr: "Sadece listelere bakma, sıralamayı değiştir.",
                  en: "Don’t just watch the charts, change the ranking.",
                  de: "Schau nicht nur auf die Listen, verändere das Ranking.",
                })}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">
                {localize(locale, {
                  tr: "Keşfet bölümünde yeni şarkıları dinle, beğen ve topluluk listelerinde yükselmelerine yardımcı ol.",
                  en: "Listen to new songs, like them and help them rise through the community charts.",
                  de: "Höre neue Songs, like sie und hilf ihnen in den Community-Listen aufzusteigen.",
                })}
              </p>
            </div>

            <Link
              className="inline-flex w-fit items-center justify-center rounded-full bg-[#071612] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#087d70]"
              href="/discover"
            >
              {localize(locale, {
                tr: "Keşfe başla",
                en: "Start discovering",
                de: "Entdeckung starten",
              })}
            </Link>
          </div>
        </section>
      </div>
    </PublicGrowthShell>
  );
}
