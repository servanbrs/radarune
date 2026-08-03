import Link from "next/link";
import type { ReactNode } from "react";

import {
  canAccessAdmin,
  toAdminActor,
} from "@/features/admin/server/admin-context";
import { UserMenu } from "@/features/authentication/components/user-menu";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { creatorAccessService } from "@/features/authorization/server/creator-access.service";
import { GlobalSearch } from "@/components/global-search";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { MobileBottomNav } from "@/features/platform/components/mobile-bottom-nav";

type NavigationItem = {
  href: string;
  label: string;
};

export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { organization, user } = await authSessionService.getDashboardContext();

  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  const adminAccess = canAccessAdmin(actor);

  const creatorAccess = creatorAccessService.getAccess({
    systemRole: user.systemRole,
  });
  const locale = organization.organization.defaultLocale;
  const english = locale === "en-US";
  const german = locale === "de-DE";
  const tr = (turkish: string, englishText: string, germanText: string) =>
    english ? englishText : german ? germanText : turkish;

  const primaryNavigation: NavigationItem[] = [
    {
      href: "/dashboard",
      label: tr("Ana Sayfa", "Home", "Startseite"),
    },
    { href: "/discover", label: tr("Keşfet", "Discover", "Entdecken") },
    { href: "/lists", label: tr("Listeler", "Lists", "Listen") },
  ];

  return (
    <div className="app-shell flex min-h-screen min-w-0 flex-col">
      <header data-radarune-app-header="dark" className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#081311]/95 text-white shadow-[0_12px_50px_rgba(4,15,13,0.18)] backdrop-blur-2xl">
        <div className="relative mx-auto flex min-h-[72px] w-full max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link className="min-w-0 shrink-0" href="/dashboard">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-300">
              Radarune
            </p>

            <p className="hidden text-sm font-semibold text-white/75 sm:block">
              Music Platform
            </p>
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
            {primaryNavigation.map((item) => (
              <Link
                className="whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden min-w-0 items-center justify-end gap-3 lg:flex">
            <div className="w-[260px] xl:w-[340px]">
              <GlobalSearch />
            </div>

                <NotificationBell />

            <UserMenu
              adminAccess={adminAccess}
              artistAccess={creatorAccess.isArtist}
              email={user.email}
              locale={organization.organization.defaultLocale}
              name={user.name}
            />
          </div>

        </div>
      </header>

      <div className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">{children}</div>

      <footer data-radarune-app-footer className="border-t border-line/70 bg-surface px-4 pb-28 pt-8 text-sm text-muted sm:px-6 lg:px-8 lg:pb-8">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-foreground">Radarune</p>
            <p className="mt-1">Müziğin radarı · Yayın ve keşif platformu</p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link className="hover:text-foreground" href="/about">
              {tr("Hakkımızda", "About", "Über uns")}
            </Link>
            <Link className="hover:text-foreground" href="/contact">
              {tr("İletişim", "Contact", "Kontakt")}
            </Link>
            <Link className="hover:text-foreground" href="/terms">
              {tr("Kullanım koşulları", "Terms", "Nutzungsbedingungen")}
            </Link>
            <LanguageSwitcher locale={locale} />
          </nav>
        </div>
      </footer>
      <MobileBottomNav homeHref="/dashboard" profileHref="/mobile-profile" profileLabel="Profil" />
    </div>
  );
}
