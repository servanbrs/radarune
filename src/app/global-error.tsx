"use client";

import { useEffect } from "react";

import { ErrorRecoveryActions } from "@/components/error-recovery-actions";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="tr">
      <body className="bg-[#0b1020] text-[#f1f3f8]">
        <main className="grid min-h-screen place-items-center px-4 py-16">
          <section className="w-full max-w-xl rounded-[2rem] border border-[#2b344b] bg-[#151c2d] p-8 shadow-2xl sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6a85f]">
              Radarune
            </p>
            <h1 className="mt-3 text-3xl font-semibold">
              Beklenmeyen bir sorun oluştu
            </h1>
            <p className="mt-3 leading-7 text-[#aeb7c9]">
              Önceki sayfaya dönebilir veya sayfayı yeniden yüklemeyi
              deneyebilirsiniz.
            </p>
            {error.digest ? (
              <p className="mt-4 text-xs text-[#aeb7c9]">
                Hata kodu: {error.digest}
              </p>
            ) : null}
            <ErrorRecoveryActions onRetry={reset} />
          </section>
        </main>
      </body>
    </html>
  );
}
