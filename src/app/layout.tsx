import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import "./globals.css";
import { configurationResolver } from "@/features/configuration/server/configuration-resolver.service";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";

const stringSetting = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const booleanSetting = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

const normalizeMediaUrl = (url: string) => {
  // Uploaded branding files used to be stored with the current host
  // (localhost during development). Keep those files portable between local
  // and production deployments by using only their same-origin media path.
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/api/media/")) return `${parsed.pathname}${parsed.search}`;
  } catch {
    // Relative URLs are already deployment-safe.
  }
  return url;
};

const versionedIconUrl = (url: string | null | undefined, updatedAt: unknown) => {
  if (!url) return undefined;
  const portableUrl = normalizeMediaUrl(url);
  const separator = portableUrl.includes("?") ? "&" : "?";
  const timestamp =
    updatedAt instanceof Date
      ? updatedAt.getTime()
      : typeof updatedAt === "string"
        ? Date.parse(updatedAt)
        : Number.NaN;
  return `${portableUrl}${separator}v=${Number.isFinite(timestamp) ? timestamp : Date.now()}`;
};

const faviconUrlOrFallback = (url: string | null | undefined) =>
  url ?? "/favicon-transparent-48.png";

async function resolveWithin<T>(promise: Promise<T>, timeoutMs = 2500): Promise<T | null> {
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

const getCachedSeoSettings = (organizationId?: string) =>
  unstable_cache(
    async () => {
      const defaultTitle = "Radarune | Müzik operasyon platformu";
      const defaultDescription = "Sanatçılar ve label ekipleri için release, dağıtım, royalty ve keşif operasyonları.";

      const [title, description, verification, indexing] = await Promise.all([
        configurationResolver.resolve({
          key: "SEO_TITLE",
          ...(organizationId ? { organizationId } : {}),
          defaultValue: defaultTitle,
          parse: stringSetting,
        }),
        configurationResolver.resolve({
          key: "SEO_DESCRIPTION",
          ...(organizationId ? { organizationId } : {}),
          defaultValue: defaultDescription,
          parse: stringSetting,
        }),
        configurationResolver.resolve({
          key: "SEO_GOOGLE_SITE_VERIFICATION",
          ...(organizationId ? { organizationId } : {}),
          defaultValue: "",
          parse: stringSetting,
        }),
        configurationResolver.resolve({
          key: "SEO_INDEXING_ENABLED",
          ...(organizationId ? { organizationId } : {}),
          defaultValue: true,
          parse: booleanSetting,
        }),
      ]);

      return {
        title: title.value,
        description: description.value,
        verification: verification.value ?? "",
        indexing: indexing.value,
      };
    },
    ["public-seo-settings", organizationId ?? "default"],
    { revalidate: 60 },
  )();

const seoInFlight = new Map<string, Promise<Awaited<ReturnType<typeof getCachedSeoSettings>>>>();

function getSharedSeoSettings(organizationId?: string) {
  const key = organizationId ?? "default";
  const existing = seoInFlight.get(key);
  if (existing) return existing;

  const pending = getCachedSeoSettings(organizationId).finally(() => {
    if (seoInFlight.get(key) === pending) seoInFlight.delete(key);
  });
  seoInFlight.set(key, pending);
  return pending;
}

export async function generateMetadata(): Promise<Metadata> {
  let tenant: Awaited<ReturnType<typeof tenantContextService.resolveFromRequest>> = null;
  try {
    tenant = await resolveWithin(tenantContextService.resolveFromRequest());
  } catch {
    // Metadata must never take the site down when the database is unavailable.
  }

  // Local development skips the SEO setting queries, but still reads branding
  // so an admin-uploaded favicon is visible in the local browser as well.
  if (process.env.NODE_ENV !== "production") {
    const faviconUrl = versionedIconUrl(tenant?.tenantBranding?.faviconUrl, tenant?.tenantBranding?.updatedAt);
    return {
      title: "Radarune | Müzik operasyon platformu",
      description: "Sanatçılar ve label ekipleri için release, dağıtım, royalty ve keşif operasyonları.",
      icons: {
        icon: [
          { url: "/favicon.ico", type: "image/x-icon" },
          ...(faviconUrl ? [{ url: faviconUrl }] : []),
        ],
        shortcut: "/favicon.ico",
        apple: faviconUrlOrFallback(faviconUrl),
      },
    };
  }
  const organizationId = tenant?.id;
  const defaultTitle = "Radarune | Müzik operasyon platformu";
  const defaultDescription = "Sanatçılar ve label ekipleri için release, dağıtım, royalty ve keşif operasyonları.";
  let titleValue = defaultTitle;
  let descriptionValue = defaultDescription;
  let verificationValue = "";
  let indexingValue = true;

  // A production build must not fail just because the runtime database is
  // temporarily unreachable. Tenant-specific SEO values are an enhancement;
  // the safe defaults still produce valid metadata and allow deployment.
  try {
    const seo = await getSharedSeoSettings(organizationId);
    titleValue = seo.title;
    descriptionValue = seo.description;
    verificationValue = seo.verification;
    indexingValue = seo.indexing;
  } catch {
    // Keep the build and public pages available while the database recovers.
  }

  const faviconUrl = versionedIconUrl(tenant?.tenantBranding?.faviconUrl, tenant?.tenantBranding?.updatedAt);
  const logoUrl = versionedIconUrl(tenant?.tenantBranding?.logoUrl, tenant?.tenantBranding?.updatedAt);
  return {
    title: titleValue,
    description: descriptionValue,
    ...(verificationValue ? { verification: { google: verificationValue } } : {}),
    icons: {
      icon: [
        { url: "/favicon.ico", type: "image/x-icon" },
        ...(faviconUrl ? [{ url: faviconUrl }] : []),
      ],
      shortcut: "/favicon.ico",
      apple: faviconUrlOrFallback(faviconUrl),
    },
    ...(logoUrl
      ? {
          openGraph: {
            title: titleValue,
            description: descriptionValue,
            images: [{ url: logoUrl, alt: "Radarune" }],
          },
        }
      : {}),
    robots: indexingValue ? undefined : { index: false, follow: false },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${""} ${""} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
