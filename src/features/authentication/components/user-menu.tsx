"use client";

import Link from "next/link";
import {
  ChartNoAxesCombined,
  ChevronDown,
  KeyRound,
  LayoutDashboard,
  ShieldCheck,
  ShieldHalf,
  UserRound,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/features/authentication/components/sign-out-button";

export function UserMenu({ name, email, adminAccess, artistAccess, locale = "tr-TR" }: { name: string; email: string; adminAccess?: boolean; artistAccess?: boolean; locale?: string }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 text-white [&::-webkit-details-marker]:hidden">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-300 text-xs font-bold text-[#08201a]">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-semibold xl:block">{name}</span>
        <ChevronDown className="h-4 w-4 text-white/60 transition group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-white/10 bg-[#10201d] p-2 text-white shadow-2xl">
        <div className="border-b border-white/10 px-3 pb-3">
          <p className="truncate text-sm font-semibold text-white">{name}</p>
          <p className="mt-1 truncate text-xs text-white/50">{email}</p>
        </div>
        <nav className="grid gap-1 py-2">
          {adminAccess ? <Link className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white" href="/admin"><LayoutDashboard className="h-4 w-4 text-emerald-300" /> Yönetim paneli</Link> : null}
          {adminAccess ? <Link className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white" href="/admin/moderation"><ShieldHalf className="h-4 w-4 text-amber-300" /> Moderatör paneli</Link> : null}
          {artistAccess ? <Link className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white" href="/artist-profile"><UserRound className="h-4 w-4" /> Sanatçı paneli</Link> : null}
          <Link className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white" href="/settings">
            <UserRound className="h-4 w-4" /> Profil ayarları
          </Link>
          <Link className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white" href="/settings#security">
            <KeyRound className="h-4 w-4" /> Şifre değiştir
          </Link>
          <Link className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white" href="/analytics">
            <ChartNoAxesCombined className="h-4 w-4 text-sky-300" /> Analizler
          </Link>
        </nav>
        <div className="flex items-center justify-between border-t border-white/10 pt-2">
          <LanguageSwitcher dark locale={locale} />
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/45">Tema</span>
            <ThemeToggle dark />
          </div>
        </div>
        <div className="border-t border-line pt-2 [&_button]:w-full [&_button]:border-danger/40 [&_button]:bg-danger/10 [&_button]:text-danger [&_button]:hover:bg-danger/20">
          <SignOutButton />
        </div>
      </div>
    </details>
  );
}
