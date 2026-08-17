"use client";

import { useEffect } from "react";

import { ErrorRecoveryActions } from "@/components/error-recovery-actions";

export default function ErrorPage({
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
    <main className="grid min-h-[70vh] place-items-center bg-background px-4 py-16 text-foreground">
      <section className="w-full max-w-xl rounded-[2rem] border border-line bg-surface p-8 shadow-xl sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Radarune
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Bu sayfa yüklenemedi</h1>
        <p className="mt-3 leading-7 text-muted">
          Geçici bir sorun oluştu. Önceki sayfaya dönebilir veya işlemi yeniden
          deneyebilirsiniz.
        </p>
        {error.digest ? (
          <p className="mt-4 text-xs text-muted">Hata kodu: {error.digest}</p>
        ) : null}
        <ErrorRecoveryActions onRetry={reset} />
      </section>
    </main>
  );
}
