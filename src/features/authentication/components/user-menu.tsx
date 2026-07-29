"use client";

import Link from "next/link";
import { ChevronDown, KeyRound, Settings, UserRound } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/features/authentication/components/sign-out-button";

export function UserMenu({ name, email, adminAccess, artistAccess, locale = "tr-TR" }: { name: string; email: string; adminAccess?: boolean; artistAccess?: boolean; locale?: string }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 [&::-webkit-details-marker]:hidden">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-semibold xl:block">{name}</span>
        <ChevronDown className="h-4 w-4 text-muted transition group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-line bg-surface p-2 shadow-2xl">
        <div className="border-b border-line px-3 pb-3">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="mt-1 truncate text-xs text-muted">{email}</p>
        </div>
        <nav className="grid gap-1 py-2">
          {adminAccess ? <Link className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-strong hover:text-foreground" href="/admin"><Settings className="h-4 w-4" /> Yönetim paneli</Link> : null}
          {adminAccess ? <Link className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-strong hover:text-foreground" href="/admin/moderation"><Settings className="h-4 w-4" /> Moderatör paneli</Link> : null}
          {artistAccess ? <Link className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-strong hover:text-foreground" href="/artist-profile"><UserRound className="h-4 w-4" /> Sanatçı paneli</Link> : null}
          <Link className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-strong hover:text-foreground" href="/settings">
            <UserRound className="h-4 w-4" /> Profil ayarları
          </Link>
          <Link className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-strong hover:text-foreground" href="/settings#security">
            <KeyRound className="h-4 w-4" /> Şifre değiştir
          </Link>
          <Link className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-strong hover:text-foreground" href="/analytics">
            <Settings className="h-4 w-4" /> Analizler
          </Link>
        </nav>
        <div className="flex items-center justify-between border-t border-line pt-2">
          <LanguageSwitcher locale={locale} />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Tema</span>
            <ThemeToggle />
          </div>
        </div>
        <div className="border-t border-line pt-2 [&_button]:w-full [&_button]:border-danger/40 [&_button]:bg-danger/10 [&_button]:text-danger [&_button]:hover:bg-danger/20">
          <SignOutButton />
        </div>
      </div>
    </details>
  );
}
