/* eslint-disable @next/next/no-img-element */
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";
import { siteBuilderService } from "@/features/platform/server/services/site-builder.service";
import { RadaruneLandingPage } from "@/features/platform/components/radarune-landing-page";
import { MobileBottomNav } from "@/features/platform/components/mobile-bottom-nav";
import { getCachedPublicCandidates } from "@/features/growth/server/services/discover.service";

export const metadata: Metadata = {
  title: "Radarune | Müziğini keşfet",
  description: "Yeni şarkıları keşfet, sanatçıları takip et ve müziğini Radarune topluluğuyla buluştur.",
  alternates: { canonical: "/" },
  openGraph: { title: "Radarune | Müziğini keşfet", description: "Yeni şarkıları keşfet, sanatçıları takip et ve müziğini Radarune topluluğuyla buluştur.", url: "/", type: "website" },
};

function renderValue(value: string | null | undefined) {
  return value?.trim() || null;
}

const getCachedHomepage = (organizationId: string) =>
  unstable_cache(
    () => siteBuilderService.getHomepage(organizationId),
    ["public-homepage", organizationId],
    { revalidate: 60 },
  )();

const PUBLIC_PAGE_TIMEOUT_MS = 2500;

async function resolveWithin<T>(promise: Promise<T>, timeoutMs = PUBLIC_PAGE_TIMEOUT_MS): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export default async function HomePage() {
  // These lookups are independent. Running them together removes one full
  // database round-trip from the public landing page's critical path.
  const [session, tenant] = await Promise.all([
    resolveWithin(authSessionService.getOptionalSession()),
    resolveWithin(tenantContextService.resolveFromRequest()),
  ]);

  if (!session) {
    if (!tenant) {
      return <RadaruneLandingPage discoverReleases={[]} />;
    }
    const page = await resolveWithin(getCachedHomepage(tenant.id));
    if (!page) return <RadaruneLandingPage discoverReleases={[]} />;
    const sections = page?.sections.filter((section) => section.active).sort((a, b) => a.sortOrder - b.sortOrder) ?? [];
    if (sections.length === 0 && process.env.NODE_ENV !== "production") {
      let discoverReleases: Awaited<ReturnType<typeof getCachedPublicCandidates>> = [];
      try {
        discoverReleases = await getCachedPublicCandidates();
      } catch {
        // Keep the local landing page usable while the remote DB is recovering.
      }
      return <RadaruneLandingPage discoverReleases={discoverReleases} />;
    }
    const theme = tenant.themeConfig?.draft ? null : tenant.themeConfig;
    const themeStyle = {
      "--background": theme?.backgroundColor,
      "--foreground": theme?.textColor,
      "--surface": theme?.cardColor,
      "--surface-strong": theme?.secondaryColor,
      "--line": theme?.borderColor,
      "--accent": theme?.primaryColor,
      "--accent-foreground": theme?.buttonText,
      "--muted": theme?.mutedTextColor,
      "--danger": theme?.errorColor,
    } as CSSProperties;
    return (
      <main className="min-h-dvh bg-background pb-20 text-foreground lg:pb-0" style={themeStyle}>
        <header data-scroll-hide className="sticky top-0 z-50 border-b border-line/70 bg-surface/90 px-6 py-4 backdrop-blur md:px-10 md:py-5">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {tenant.tenantBranding?.logoUrl ? /* Tenant-owned URLs cannot be statically configured for next/image. */ <img alt={tenant.name} className="h-9 w-9 rounded-xl object-cover" src={tenant.tenantBranding.logoUrl} /> : null}
              <span className="font-semibold">{tenant.tenantBranding?.brandName ?? tenant.name}</span>
            </div>
            <a className="hidden rounded-full border border-line px-4 py-2 text-sm font-semibold lg:inline-flex" href="/sign-in">Giriş yap</a>
          </div>
        </header>
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:px-10">
          {sections.map((section, index) => (
            <section className="panel p-8" key={section.id}>
              {section.imageUrl ? /* Tenant-owned URLs cannot be statically configured for next/image. */ <img alt={renderValue(section.title) ?? ""} className="mb-6 max-h-96 w-full rounded-3xl object-cover" decoding="async" fetchPriority={index === 0 ? "high" : "auto"} loading={index === 0 ? "eager" : "lazy"} src={section.imageUrl} /> : null}
              {renderValue(section.title) ? <h1 className="text-3xl font-semibold">{section.title}</h1> : null}
              {renderValue(section.subtitle) ? <p className="mt-2 text-lg text-muted">{section.subtitle}</p> : null}
              {renderValue(section.description) ? <p className="mt-4 max-w-3xl whitespace-pre-wrap leading-7 text-muted">{section.description}</p> : null}
              {section.ctaUrl && section.ctaLabel ? <a className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground" href={section.ctaUrl}>{section.ctaLabel}</a> : null}
            </section>
          ))}
          {sections.length === 0 ? <section className="panel p-10"><h1 className="text-3xl font-semibold">{tenant.name}</h1><p className="mt-3 text-muted">Bu tenant için yayınlanmış ana sayfa içeriği bulunmuyor.</p></section> : null}
        </div>
        <MobileBottomNav homeHref="/" profileHref="/sign-in?next=%2F" profileLabel="Giriş" />
      </main>
    );
  }

  redirect("/dashboard");
}
