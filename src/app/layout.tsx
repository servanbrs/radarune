import type { Metadata } from "next";
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

const versionedIconUrl = (url: string | null | undefined, updatedAt: Date | null | undefined) => {
  if (!url) return undefined;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${updatedAt?.getTime() ?? Date.now()}`;
};

export async function generateMetadata(): Promise<Metadata> {
  let tenant: Awaited<ReturnType<typeof tenantContextService.resolveFromRequest>> = null;
  try {
    tenant = await tenantContextService.resolveFromRequest();
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
      ...(faviconUrl ? { icons: { icon: faviconUrl, shortcut: faviconUrl, apple: faviconUrl } } : {}),
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
    titleValue = title.value;
    descriptionValue = description.value;
    verificationValue = verification.value ?? "";
    indexingValue = indexing.value;
  } catch {
    // Keep the build and public pages available while the database recovers.
  }

  const faviconUrl = versionedIconUrl(tenant?.tenantBranding?.faviconUrl, tenant?.tenantBranding?.updatedAt);
  return {
    title: titleValue,
    description: descriptionValue,
    ...(verificationValue ? { verification: { google: verificationValue } } : {}),
    ...(faviconUrl ? { icons: { icon: faviconUrl, shortcut: faviconUrl, apple: faviconUrl } } : {}),
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
