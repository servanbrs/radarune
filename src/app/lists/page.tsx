import Link from "next/link";
import {
  ArrowDown,
  Globe2,
  Radio,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { PublicCharts } from "@/features/growth/components/public-charts";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import { publicChartsService } from "@/features/growth/server/services/public-charts.service";
import { prisma } from "@/server/prisma/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Müzik Listeleri | Radarune",
  description:
    "YouTube Türkiye trendleri, global müzik gündemi ve Radarune topluluğunun yükselen şarkıları.",
};

const quickLinks = [
  {
    href: "#youtube-turkey",
    label: "Türkiye",
    icon: Radio,
  },
  {
    href: "#radarune-most-liked",
    label: "Topluluk",
    icon: TrendingUp,
  },
  {
    href: "#youtube-global",
    label: "Global",
    icon: Globe2,
  },
  {
    href: "#radarune-new",
    label: "Yeni çıkanlar",
    icon: Sparkles,
  },
];

export default async function ListsPage() {
  const session =
    await authSessionService.getOptionalSession();

  let organizationId: string | null = null;

  if (session) {
    const membership =
      await prisma.organizationMembership.findFirst({
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
      });

    organizationId = membership?.organizationId ?? null;
  }

  if (!organizationId) {
    const publicOrganization =
      await prisma.organization.findFirst({
        where: {
          tenantStatus: "ACTIVE",
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
        },
      });

    organizationId = publicOrganization?.id ?? null;
  }

  const sections = organizationId
    ? await publicChartsService.getPublicCharts(
        organizationId,
      )
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
    <PublicGrowthShell currentUser={currentUser}>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[2.4rem] bg-[#071612] px-6 py-10 text-white shadow-[0_30px_100px_rgba(4,24,20,0.25)] sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          <div className="pointer-events-none absolute -right-28 -top-36 size-[420px] rounded-full bg-[#18d7aa]/20 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-48 left-[25%] size-[390px] rounded-full bg-blue-400/10 blur-[100px]" />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.65fr)] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#54e7c2]">
                RADARUNE / CHARTS
              </p>

              <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-[-0.055em] sm:text-6xl lg:text-8xl">
                Müziğin nabzı
                <span className="block text-[#54e7c2]">
                  burada atıyor.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
                Türkiye trendlerini, dünyadan yükselen
                şarkıları ve Radarune topluluğunun gerçek
                etkileşimleriyle öne çıkan yayınları keşfet.
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
                      {item.label}
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
                  Güncel liste
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                <p className="text-4xl font-black">
                  {totalTracks}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                  Öne çıkan içerik
                </p>
              </div>

              <div className="col-span-2 rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                <p className="text-sm font-bold">
                  Gerçek ve güncel veri
                </p>

                <p className="mt-2 text-xs leading-5 text-white/45">
                  YouTube listeleri 30 dakika, Radarune
                  topluluk verileri 5 dakika önbellekte
                  tutulur.
                </p>
              </div>
            </div>
          </div>

          <a
            aria-label="Listelere git"
            className="absolute bottom-5 right-6 hidden size-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-white/70 transition hover:bg-white hover:text-black sm:flex"
            href="#youtube-turkey"
          >
            <ArrowDown className="size-5" />
          </a>
        </section>

        <PublicCharts sections={sections} />

        <section className="rounded-[2rem] border border-black/[0.06] bg-[#e9faf4] p-7 sm:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#087d70]">
                RADARUNE DISCOVER
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-black">
                Sadece listelere bakma, sıralamayı değiştir.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">
                Keşfet bölümünde yeni şarkıları dinle,
                beğen ve topluluk listelerinde yükselmelerine
                yardımcı ol.
              </p>
            </div>

            <Link
              className="inline-flex w-fit items-center justify-center rounded-full bg-[#071612] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#087d70]"
              href="/discover"
            >
              Keşfe başla
            </Link>
          </div>
        </section>
      </div>
    </PublicGrowthShell>
  );
}
