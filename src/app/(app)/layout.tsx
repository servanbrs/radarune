import Link from "next/link";
import type { ReactNode } from "react";
import { SignOutButton } from "@/features/authentication/components/sign-out-button";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";

const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
  },
  {
    href: "/labels",
    label: "Labels",
  },
  {
    href: "/artists",
    label: "Artists",
  },
];

export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { organization, user } = await authSessionService.getDashboardContext();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-line/70 bg-surface/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 md:px-10">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted">
                Radarune
              </p>
              <p className="text-sm font-semibold">{organization.organization.name}</p>
            </div>
            <nav className="flex items-center gap-2">
              {navigationItems.map((item) => (
                <Link
                  className="rounded-full px-4 py-2 text-sm font-medium text-muted hover:bg-white hover:text-foreground"
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {organization.role}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
