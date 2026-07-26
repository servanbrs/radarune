/* eslint-disable @next/next/no-img-element */
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { organizationService } from "@/features/organization/server/services/organization.service";
import { tenantContextService } from "@/features/platform/server/services/tenant-context.service";
import { siteBuilderService } from "@/features/platform/server/services/site-builder.service";
import { prisma } from "@/server/prisma/prisma";

function renderValue(value: string | null | undefined) {
  return value?.trim() || null;
}

export default async function HomePage() {
  const session = await authSessionService.getOptionalSession();

  if (!session) {
    const tenant = await tenantContextService.resolveFromRequest();
    if (!tenant) redirect("/sign-in");
    const page = await siteBuilderService.getHomepage(tenant.id);
    const sections = page?.sections.filter((section) => section.active).sort((a, b) => a.sortOrder - b.sortOrder) ?? [];
    const theme = await prisma.themeConfig.findFirst({ where: { organizationId: tenant.id, draft: false } });
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
      <main className="min-h-screen bg-background text-foreground" style={themeStyle}>
        <header className="border-b border-line/70 bg-surface/80 px-6 py-5 backdrop-blur md:px-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {tenant.tenantBranding?.logoUrl ? /* Tenant-owned URLs cannot be statically configured for next/image. */ <img alt={tenant.name} className="h-9 w-9 rounded-xl object-cover" src={tenant.tenantBranding.logoUrl} /> : null}
              <span className="font-semibold">{tenant.tenantBranding?.brandName ?? tenant.name}</span>
            </div>
            <a className="rounded-full border border-line px-4 py-2 text-sm font-semibold" href="/sign-in">Giriş yap</a>
          </div>
        </header>
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:px-10">
          {sections.map((section) => (
            <section className="panel p-8" key={section.id}>
              {section.imageUrl ? /* Tenant-owned URLs cannot be statically configured for next/image. */ <img alt={renderValue(section.title) ?? ""} className="mb-6 max-h-96 w-full rounded-3xl object-cover" src={section.imageUrl} /> : null}
              {renderValue(section.title) ? <h1 className="text-3xl font-semibold">{section.title}</h1> : null}
              {renderValue(section.subtitle) ? <p className="mt-2 text-lg text-muted">{section.subtitle}</p> : null}
              {renderValue(section.description) ? <p className="mt-4 max-w-3xl whitespace-pre-wrap leading-7 text-muted">{section.description}</p> : null}
              {section.ctaUrl && section.ctaLabel ? <a className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground" href={section.ctaUrl}>{section.ctaLabel}</a> : null}
            </section>
          ))}
          {sections.length === 0 ? <section className="panel p-10"><h1 className="text-3xl font-semibold">{tenant.name}</h1><p className="mt-3 text-muted">Bu tenant için yayınlanmış ana sayfa içeriği bulunmuyor.</p></section> : null}
        </div>
      </main>
    );
  }

  const organization = await organizationService.getOptionalOrganizationContext(
    session.user.id,
  );

  redirect(organization ? "/dashboard" : "/onboarding/organization");
}
