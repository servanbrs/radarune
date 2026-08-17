"use client";

import { ArrowLeft, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function ErrorRecoveryActions({
  onRetry,
}: {
  onRetry?: () => void;
}) {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        onClick={goBack}
        type="button"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Önceki sayfaya dön
      </button>

      {onRetry ? (
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-surface-strong px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          onClick={onRetry}
          type="button"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Tekrar dene
        </button>
      ) : null}
    </div>
  );
}
