"use client";

import Link from "next/link";
import {
  ChevronDown,
  CircleUserRound,
  LifeBuoy,
  LayoutDashboard,
  Music2,
  Settings,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PublicUserMenuProps = {
  currentUser: {
    name: string;
    username?: string | null;
  };
};

export function PublicUserMenu({
  currentUser,
}: PublicUserMenuProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const profileHref = currentUser.username
    ? `/u/${currentUser.username}`
    : "/dashboard";

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        closeOnOutsideClick,
      );
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        aria-expanded={open}
          className="flex max-w-48 items-center gap-2 rounded-full border border-white/10 px-1.5 py-1 text-white transition hover:border-white/20 hover:bg-white/[0.06]"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0c8375] to-[#111827] text-sm font-bold text-white">
          {currentUser.name.slice(0, 1).toUpperCase()}
        </span>

        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-left text-sm font-semibold text-white">
            {currentUser.name}
          </span>

          {currentUser.username ? (
            <span className="block truncate text-left text-[11px] text-white/55">
              @{currentUser.username}
            </span>
          ) : null}
        </span>

        <ChevronDown
          className={`hidden size-4 shrink-0 text-white/60 transition sm:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <section className="absolute right-0 top-12 z-[100] w-64 overflow-hidden rounded-3xl border border-black/10 bg-white p-2 shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
          <div className="flex items-center justify-between px-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-black">
                {currentUser.name}
              </p>

              <p className="truncate text-xs text-black/45">
                {currentUser.username
                  ? `@${currentUser.username}`
                  : "Radarune kullanıcısı"}
              </p>
            </div>

            <button
              aria-label="Menüyü kapat"
              className="inline-flex size-8 items-center justify-center rounded-full text-black/40 hover:bg-black/5 hover:text-black"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="h-px bg-black/5" />

          <nav className="grid gap-1 py-2">
            <Link
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-black/70 transition hover:bg-black/[0.04] hover:text-black"
              href="/dashboard"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="size-4 text-[#087d70]" />
              Dashboard
            </Link>

            <Link
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-black/70 transition hover:bg-black/[0.04] hover:text-black"
              href={profileHref}
              onClick={() => setOpen(false)}
            >
              <CircleUserRound className="size-4 text-[#087d70]" />
              Profilim
            </Link>

            <Link
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-black/70 transition hover:bg-black/[0.04] hover:text-black"
              href="/playlists"
              onClick={() => setOpen(false)}
            >
              <Music2 className="size-4 text-[#087d70]" />
              Playlistlerim
            </Link>

            <Link
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-black/70 transition hover:bg-black/[0.04] hover:text-black"
              href="/settings"
              onClick={() => setOpen(false)}
            >
              <Settings className="size-4 text-[#087d70]" />
              Ayarlar
            </Link>

            <Link
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-black/70 transition hover:bg-black/[0.04] hover:text-black"
              href="/dashboard/support"
              onClick={() => setOpen(false)}
            >
              <LifeBuoy className="size-4 text-[#087d70]" />
              Destek merkezi
            </Link>
          </nav>
        </section>
      ) : null}
    </div>
  );
}
