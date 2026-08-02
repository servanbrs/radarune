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

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await tenantContextService.resolveFromRequest();
  const organizationId = tenant?.id;
  const [title, description, verification, indexing] = await Promise.all([
    configurationResolver.resolve({
      key: "SEO_TITLE",
      ...(organizationId ? { organizationId } : {}),
      defaultValue: "Radarune | Müzik operasyon platformu",
      parse: stringSetting,
    }),
    configurationResolver.resolve({
      key: "SEO_DESCRIPTION",
      ...(organizationId ? { organizationId } : {}),
      defaultValue: "Sanatçılar ve label ekipleri için release, dağıtım, royalty ve keşif operasyonları.",
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

  const verificationValue = verification.value;
  return {
    title: title.value,
    description: description.value,
    ...(verificationValue ? { verification: { google: verificationValue } } : {}),
    robots: indexing.value ? undefined : { index: false, follow: false },
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
