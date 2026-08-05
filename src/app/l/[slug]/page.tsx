import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import { growthRepository } from "@/features/growth/server/repositories/growth.repository";
import { smartLinkAnalyticsService } from "@/features/growth/server/services/smart-link-analytics.service";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const smartLink = await growthRepository.findSmartLinkBySlug(slug);
  return {
    title: smartLink?.seoTitle ?? smartLink?.title ?? "Radarune Smart Link",
    description: smartLink?.seoDescription ?? smartLink?.description ?? "Radarune üzerinde müziği dinle.",
    openGraph: { images: smartLink?.ogImageUrl || smartLink?.coverImageUrl ? [smartLink.ogImageUrl ?? smartLink.coverImageUrl ?? ""] : [] },
  };
}

export default async function SmartLinkPublicPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const query = await searchParams;
  const smartLink = await growthRepository.findSmartLinkBySlug(slug);
  if (!smartLink || !smartLink.active) {
    notFound();
  }

  const headerList = await headers();
  const userAgent = headerList.get("user-agent") ?? undefined;
  const referrer = headerList.get("referer") ?? undefined;
  const utmSource = typeof query.utm_source === "string" ? query.utm_source : undefined;
  const utmMedium = typeof query.utm_medium === "string" ? query.utm_medium : undefined;
  const utmCampaign = typeof query.utm_campaign === "string" ? query.utm_campaign : undefined;
  await smartLinkAnalyticsService.recordView({
    organizationId: smartLink.organizationId,
    smartLinkId: smartLink.id,
    ip: headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0",
    ...(userAgent ? { userAgent } : {}),
    ...(referrer ? { referrer } : {}),
    ...(utmSource ? { utmSource } : {}),
    ...(utmMedium ? { utmMedium } : {}),
    ...(utmCampaign ? { utmCampaign } : {}),
  });

  return (
    <PublicGrowthShell>
      <section className="rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur">
        <div className="mx-auto flex items-center justify-center gap-4">
          <div aria-label="Sanatçı profil fotoğrafı" className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-emerald-100 text-2xl font-black text-emerald-800 shadow-lg">{smartLink.artist.profileImageUrl ? <img alt={`${smartLink.artist.name} profil fotoğrafı`} className="size-full object-cover" src={smartLink.artist.profileImageUrl} /> : smartLink.artist.name.slice(0, 1).toUpperCase()}</div>
          {smartLink.coverImageUrl ? <div aria-label="Kapak görseli" className="h-40 w-40 rounded-[2rem] bg-cover bg-center shadow-lg" style={{ backgroundImage: `url(${smartLink.coverImageUrl})` }} /> : null}
        </div>
        <p className="mt-6 text-xs uppercase tracking-[0.24em] text-muted">{smartLink.artist.name}</p>
        <h1 className="mt-3 text-4xl font-semibold">{smartLink.title}</h1>
        {smartLink.description ? <p className="mt-4 text-sm leading-7 text-muted">{smartLink.description}</p> : null}
        <div className="mt-8 grid gap-3">
          {smartLink.platforms.map((platform) => (
            <a className="rounded-2xl bg-foreground px-5 py-4 text-sm font-semibold text-white transition hover:opacity-90" href={`/l/${smartLink.slug}/go/${platform.id}`} key={platform.id} rel="noopener noreferrer" target="_blank">
              {platform.buttonText ?? `${platform.platform} üzerinde ${smartLink.ctaText}`}
            </a>
          ))}
        </div>
        <p className="mt-8 text-xs text-muted">Radarune ile oluşturuldu · <Link className="font-semibold hover:text-foreground" href="/">Ücretsiz Smart Link oluştur</Link></p>
      </section>
    </PublicGrowthShell>
  );
}
