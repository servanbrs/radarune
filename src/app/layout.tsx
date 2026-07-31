import type { Metadata } from "next";
import "./globals.css";
import { GlobalPlayerProvider } from "@/features/growth/components/global-player-provider";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";
import { prisma } from "@/server/prisma/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await tenantContextService.resolveFromRequest();
  // Keep the metadata lookup independent from the generated enum definition.
  // This is important during rolling deploys where the database may already
  // contain newer AdminSettingKey values while a dev/old server still has a
  // cached Prisma client. Filtering after the query prevents that mismatch
  // from taking down every page during SSR.
  const seoKeys = new Set([
    "SEO_TITLE",
    "SEO_DESCRIPTION",
    "SEO_GOOGLE_SITE_VERIFICATION",
    "SEO_INDEXING_ENABLED",
  ]);
  const allSettings = tenant
    ? await prisma.adminSetting.findMany({ where: { organizationId: tenant.id } })
    : [];
  const settings = allSettings.filter((item) => seoKeys.has(String(item.key)));
  const value = (key: string, fallback: string) => {
    const row = settings.find((item) => item.key === key);
    return typeof row?.value === "string" ? row.value : fallback;
  };
  const verification = value("SEO_GOOGLE_SITE_VERIFICATION", "");
  const indexingValue = settings.find((item) => item.key === "SEO_INDEXING_ENABLED")?.value;
  const indexingEnabled = indexingValue !== false && indexingValue !== "false";
  return {
    title: value("SEO_TITLE", "Radarune | Müzik operasyon platformu"),
    description: value("SEO_DESCRIPTION", "Sanatçılar ve label ekipleri için release, dağıtım, royalty ve keşif operasyonları."),
    ...(verification ? { verification: { google: verification } } : {}),
    robots: indexingEnabled ? undefined : { index: false, follow: false },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${""} ${""} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><GlobalPlayerProvider>{children}</GlobalPlayerProvider></body>
    </html>
  );
}
