"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        <Link href="/" className="text-2xl font-bold tracking-tight">
          Radarune
        </Link>

        <nav className="hidden gap-8 text-sm text-zinc-300 md:flex">
          <a href="#features" className="hover:text-white transition">
            Özellikler
          </a>

          <a href="#how" className="hover:text-white transition">
            Nasıl Çalışır
          </a>

          <a href="#faq" className="hover:text-white transition">
            SSS
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost">
            Giriş Yap
          </Button>

          <Button className="rounded-full bg-violet-600 hover:bg-violet-500">
            Şarkını Gönder
          </Button>
        </div>

      </div>
    </header>
  );
}