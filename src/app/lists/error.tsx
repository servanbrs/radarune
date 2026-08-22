"use client";

import { useEffect } from "react";

import { ErrorRecoveryActions } from "@/components/error-recovery-actions";

export default function ListsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("/lists yüklenemedi:", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6faf8] px-4 py-16 text-[#101817]">
      <section className="w-full max-w-xl rounded-[2rem] border border-black/[0.08] bg-white p-7 shadow-[0_20px_70px_rgba(15,23,42,0.12)] sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#087d70]">
          Radarune / Listeler
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">
          Listeler şu an yenileniyor
        </h1>
        <p className="mt-3 leading-7 text-black/55">
          Bağlantı geçici olarak yavaşladı. Sayfayı yeniden deneyebilir veya
          önceki ekrana dönebilirsin.
        </p>
        {error.digest ? (
          <p className="mt-4 text-xs text-black/40">Hata kodu: {error.digest}</p>
        ) : null}
        <ErrorRecoveryActions onRetry={reset} />
      </section>
    </main>
  );
}
