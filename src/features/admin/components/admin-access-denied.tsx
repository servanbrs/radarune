import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export function AdminAccessDenied() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#07110f] px-6 text-white">
      <section className="w-full max-w-xl rounded-[32px] border border-emerald-300/15 bg-[#0d211d] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,.35)] sm:p-12">
        <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-amber-300/10 text-amber-200">
          <ShieldAlert className="size-8" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">Radarune güvenlik alanı</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Bu kapı adminlere ait.</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/60">
          Erişim denemen güvenlik kaydına alındı. Yetkin varsa hesabınla giriş yapıp tekrar deneyebilirsin.
        </p>
        <Link className="mt-8 inline-flex rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-bold text-[#06221a] transition hover:bg-emerald-200" href="/">
          Ana sayfaya dön
        </Link>
      </section>
    </main>
  );
}
