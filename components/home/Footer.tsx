'use client';

import { Music } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-6 py-12">

        <div className="flex items-center gap-3">
          <Music className="h-6 w-6 text-violet-500" />
          <span className="text-xl font-bold text-white">
            Radarune
          </span>
        </div>

        <p className="mt-4 max-w-md text-zinc-400">
          Bağımsız sanatçılar için ücretsiz müzik dağıtım platformu.
        </p>

        <div className="mt-8 flex gap-6 text-sm text-zinc-500">
          <a href="#">Gizlilik Politikası</a>
          <a href="#">Kullanım Şartları</a>
          <a href="#">İletişim</a>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-sm text-zinc-600">
          © 2026 Radarune. Tüm hakları saklıdır.
        </div>

      </div>
    </footer>
  );
}