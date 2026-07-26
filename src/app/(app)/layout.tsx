import Link from "next/link";
import type { ReactNode } from "react";

import { SignOutButton } from "@/features/authentication/components/sign-out-button";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import {
  canAccessAdmin,
  toAdminActor,
} from "@/features/admin/server/admin-context";

const primaryNavigation = [
  {
    href: "/dashboard",
    label: "Panel",
  },
  {
    href: "/releases",
    label: "Yayınlar",
  },
  {
    href: "/artists",
    label: "Sanatçılar",
  },
  {
    href: "/discover",
    label: "Keşfet",
  },
  {
    href: "/analytics",
    label: "Analiz",
  },
] as const;

const secondaryNavigation = [
  {
    href: "/labels",
    label: "Label",
  },
  {
    href: "/royalties",
    label: "Royalty",
  },
  {
    href: "/payouts",
    label: "Ödemeler",
  },
  {
    href: "/billing",
    label: "Faturalama",
  },
  {
    href: "/smart-links",
    label: "Smart Link",
  },
  {
    href: "/presaves",
    label: "Pre-save",
  },
  {
    href: "/playlists",
    label: "Playlistler",
  },
] as const;

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

  return (
    <div className="flex min-h-screen min-w-0 flex-col">
      <header className="sticky top-0 z-50 border-b border-line/70 bg-surface/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Marka */}
          <Link
            className="min-w-0 shrink-0"
            href="/dashboard"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">
              Radarune
            </p>

            <p className="max-w-[150px] truncate text-sm font-semibold sm:max-w-[220px]">
              {organization.organization.name}
            </p>
          </Link>

          {/* Masaüstü ana menü */}
          <nav className="hidden min-w-0 items-center gap-1 lg:flex">
            {primaryNavigation.map((item) => (
              <Link
                className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-white hover:text-foreground"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}

            <details className="group relative">
              <summary className="cursor-pointer list-none rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-white hover:text-foreground [&::-webkit-details-marker]:hidden">
                Daha Fazla
              </summary>

              <div className="absolute right-0 top-12 z-50 grid w-56 gap-1 rounded-2xl border border-line bg-surface p-2 shadow-xl">
                {secondaryNavigation.map((item) => (
                  <Link
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-white hover:text-foreground"
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>

            {adminAccess ? (
              <Link
                className="ml-1 whitespace-nowrap rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                href="/admin"
              >
                Yönetim
              </Link>
            ) : null}
          </nav>

          {/* Masaüstü kullanıcı alanı */}
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <div className="hidden max-w-[170px] text-right xl:block">
              <p className="truncate text-sm font-semibold">
                {user.name}
              </p>

              <p className="truncate text-[10px] uppercase tracking-[0.16em] text-muted">
                {organization.role}
              </p>
            </div>

            <div className="hidden lg:block">
              <SignOutButton />
            </div>
          </div>

          {/* Mobil menü */}
          <details className="group relative lg:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-line bg-white text-lg [&::-webkit-details-marker]:hidden">
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
                {[...primaryNavigation, ...secondaryNavigation].map(
                  (item) => (
                    <Link
                      className="rounded-xl px-3 py-3 text-sm font-medium text-muted hover:bg-white hover:text-foreground"
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