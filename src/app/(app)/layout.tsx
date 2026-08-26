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
import { getRequestLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

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
  const moderatorAccess = user.systemRole === "MODERATOR";

  const creatorAccess = creatorAccessService.getAccess({
    systemRole: user.systemRole,
  });
  // The cookie is the user's active choice. The tenant default is only the
  // fallback when no preference has been stored yet.
  const locale = await getRequestLocale();
  const primaryNavigation: NavigationItem[] = [
    {
      href: "/dashboard",
      label: t(locale, "home"),
    },
    { href: "/discover", label: t(locale, "discover") },
    { href: "/lists", label: t(locale, "lists") },
  ];

  return (
    <div className="app-shell flex min-h-dvh min-w-0 flex-col">
      <header suppressHydrationWarning data-radarune-app-header="dark" data-scroll-hide data-scroll-hidden="false" className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#081311]/95 text-white shadow-[0_12px_50px_rgba(4,15,13,0.18)] backdrop-blur-2xl">
        <div className="relative mx-auto flex min-h-[72px] w-full max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link className="min-w-0 shrink-0" href="/dashboard">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-300">
              Radarune
            </p>

            <p className="hidden text-sm font-semibold text-white/75 sm:block">
              Music Platform
            </p>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
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

          <div className="hidden min-w-0 items-center justify-end gap-3 lg:flex">
            <div className="w-[220px] xl:w-[320px]">
              <GlobalSearch />
            </div>

                <NotificationBell locale={locale} />

            <UserMenu
              adminAccess={adminAccess}
              moderatorAccess={moderatorAccess}
              artistAccess={creatorAccess.isArtist}
              email={user.email}
              locale={locale}
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
            <p className="mt-1">{t(locale, "platformTagline")}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link className="hover:text-foreground" href="/about">
              {t(locale, "about")}
            </Link>
            <Link className="hover:text-foreground" href="/contact">
              {t(locale, "contact")}
            </Link>
            <Link className="hover:text-foreground" href="/terms">
              {t(locale, "terms")}
            </Link>
            <LanguageSwitcher locale={locale} />
          </nav>
        </div>
      </footer>
      <MobileBottomNav locale={locale} homeHref="/dashboard" profileHref="/mobile-profile" profileLabel={t(locale, "profile")} />
    </div>
  );
}
