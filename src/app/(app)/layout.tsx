import Link from "next/link";
import type { ReactNode } from "react";

import {
  canAccessAdmin,
  toAdminActor,
} from "@/features/admin/server/admin-context";
import { SignOutButton } from "@/features/authentication/components/sign-out-button";
import { UserMenu } from "@/features/authentication/components/user-menu";
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
  const { organization, user } = await authSessionService.getDashboardContext();

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
    <div className="app-shell flex min-h-screen min-w-0 flex-col">
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#081311]/95 text-white shadow-[0_12px_50px_rgba(4,15,13,0.18)] backdrop-blur-2xl">
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

          <details className="group relative ml-auto lg:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-line bg-surface text-lg [&::-webkit-details-marker]:hidden">
              ☰
            </summary>

            <div className="absolute right-0 top-12 z-50 w-[min(340px,calc(100vw-2rem))] rounded-3xl border border-line bg-surface p-3 shadow-2xl">
              <div className="border-b border-line px-3 pb-3">
                <p className="truncate font-semibold">{user.name}</p>

                <p className="mt-1 truncate text-xs text-muted">{user.email}</p>
              </div>

              <div className="mt-3 px-1">
                <GlobalSearch />
              </div>

              <nav className="mt-3 grid max-h-[60vh] gap-1 overflow-y-auto">
                {[...primaryNavigation, ...creatorNavigation].map((item) => (
                  <Link
                    className="rounded-xl px-3 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                ))}

                {adminAccess ? (
                  <Link
                    className="rounded-xl bg-emerald-300 px-3 py-3 text-sm font-semibold text-[#08201a]"
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

      <div className="hidden border-b border-white/[0.06] bg-[#0d1d1a] text-white/65 lg:block">
        <div className="mx-auto flex min-h-11 w-full max-w-[1600px] items-center gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
          <span className="mr-3 shrink-0 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300/80">Creator workspace</span>
          {[...creatorNavigation, { href: "/releases", label: "Yayınlar" }, { href: "/artist-profile", label: "Sanatçı profili" }].filter((item, index, items) => items.findIndex((candidate) => candidate.href === item.href) === index).map((item) => <Link className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10 hover:text-white" href={item.href} key={item.href}>{item.label}</Link>)}
          <span className="ml-auto shrink-0 text-[10px] font-medium text-white/35">Radarune Studio</span>
        </div>
      </div>
      <div className="overflow-x-auto border-b border-white/[0.06] bg-[#0d1d1a] text-white/65 lg:hidden">
        <div className="flex min-h-10 min-w-max items-center gap-1 px-3">
          {[...creatorNavigation, { href: "/releases", label: "Yayınlar" }, { href: "/artist-profile", label: "Sanatçı profili" }, { href: "/discover", label: "Keşfet" }].filter((item, index, items) => items.findIndex((candidate) => candidate.href === item.href) === index).map((item) => <Link className="rounded-lg px-3 py-1.5 text-[11px] font-semibold transition hover:bg-white/10 hover:text-white" href={item.href} key={item.href}>{item.label}</Link>)}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>

      <footer className="border-t border-line/70 bg-surface px-4 py-8 text-sm text-muted sm:px-6 lg:px-8">
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
    </div>
  );
}
