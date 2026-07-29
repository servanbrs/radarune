import Link from "next/link";
import type { ReactNode } from "react";

import { canAccessAdmin, toAdminActor } from "@/features/admin/server/admin-context";
import { SignOutButton } from "@/features/authentication/components/sign-out-button";
import { UserMenu } from "@/features/authentication/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { creatorAccessService } from "@/features/authorization/server/creator-access.service";
import { GlobalSearch } from "@/components/global-search";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationBell } from "@/features/notifications/components/notification-bell";

type NavigationItem = {
  href: string;
  label: string;
};

export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { organization, user } =
    await authSessionService.getDashboardContext();

  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  const adminAccess = canAccessAdmin(actor);
  const adminTheme = adminAccess;

  const creatorAccess = creatorAccessService.getAccess({
    systemRole: user.systemRole,
  });
  const english = organization.organization.defaultLocale === "en-US";

  const primaryNavigation: NavigationItem[] = [
    {
      href: "/dashboard",
      label: english ? "Home" : "Ana Sayfa",
    },
    { href: "/discover", label: english ? "Discover" : "Keşfet" },
    { href: "/about", label: english ? "About" : "Hakkımızda" },
    { href: "/contact", label: english ? "Contact" : "İletişim" },
  ];

  if (creatorAccess.showBecomeArtist) {
    primaryNavigation.push({
      href: "/become",
      label: english ? "Become an artist" : "Sanatçı Ol",
    });
  }

  if (creatorAccess.canCreateReleases) {
    primaryNavigation.push({
      href: "/releases",
      label: english ? "Releases" : "Yayınlar",
    });
  }

  if (creatorAccess.canManageArtists) {
    primaryNavigation.push({
      href: "/artists",
      label: english ? "Artists" : "Sanatçılar",
    });
  }

  const creatorNavigation: NavigationItem[] = [];

  if (creatorAccess.canUseGrowthTools) {
    creatorNavigation.push(
      {
        href: "/smart-links",
        label: "Smart Link",
      },
      {
        href: "/presaves",
        label: "Pre-save",
      },
    );
  }

  if (creatorAccess.canViewAnalytics) {
    creatorNavigation.push({
      href: "/analytics",
      label: "Analiz",
    });
  }

  return (
    <div className="flex min-h-screen min-w-0 flex-col">
      <header
        className="sticky top-0 z-50 border-b border-line/70 bg-surface/95 text-foreground backdrop-blur-xl"
      >
        <div className="mx-auto flex min-h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            className="min-w-0 shrink-0"
            href="/dashboard"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-accent">
              Radarune
            </p>

            <p className="hidden text-sm font-semibold text-foreground sm:block">
              Music Platform
            </p>
          </Link>

          <GlobalSearch />
          <nav className="hidden min-w-0 items-center gap-1 lg:flex">
            {primaryNavigation.map((item) => (
              <Link
                className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-white hover:text-foreground"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}

            {creatorNavigation.length > 0 ? (
              <details className="group relative">
                <summary className="cursor-pointer list-none rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-white hover:text-foreground [&::-webkit-details-marker]:hidden">
                  Araçlar
                </summary>

                <div className="absolute right-0 top-12 z-50 grid w-56 gap-1 rounded-2xl border border-line bg-surface p-2 shadow-xl">
                  {creatorNavigation.map((item) => (
                    <Link
                      className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-white hover:text-foreground"
                      href={item.href}
                      key={item.href}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
            ) : null}

          </nav>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <LanguageSwitcher locale={organization.organization.defaultLocale} />
            <ThemeToggle />
            <NotificationBell />
            <UserMenu adminAccess={adminAccess} artistAccess={creatorAccess.isArtist} email={user.email} name={user.name} />
          </div>

          <details className="group relative lg:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-line bg-surface text-lg [&::-webkit-details-marker]:hidden">
              ☰
            </summary>

            <div className="absolute right-0 top-12 z-50 w-[min(340px,calc(100vw-2rem))] rounded-3xl border border-line bg-surface p-3 shadow-2xl">
              <div className="border-b border-line px-3 pb-3">
                <p className="truncate font-semibold">
                  {user.name}
                </p>

                <p className="mt-1 truncate text-xs text-muted">
                  {user.email}
                </p>
              </div>

              <nav className="mt-3 grid max-h-[60vh] gap-1 overflow-y-auto">
                {[...primaryNavigation, ...creatorNavigation].map(
                  (item) => (
                    <Link
                      className="rounded-xl px-3 py-3 text-sm font-medium text-muted transition hover:bg-white hover:text-foreground"
                      href={item.href}
                      key={item.href}
                    >
                      {item.label}
                    </Link>
                  ),
                )}

                {adminAccess ? (
                  <Link
                    className="rounded-xl bg-foreground px-3 py-3 text-sm font-semibold text-white"
                    href="/admin"
                  >
                    Yönetim Paneli
                  </Link>
                ) : null}
              </nav>

              <div className="mt-3 border-t border-line pt-3">
                <SignOutButton />
              </div>
            </div>
          </details>
        </div>
      </header>

      <div className="flex min-w-0 flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
