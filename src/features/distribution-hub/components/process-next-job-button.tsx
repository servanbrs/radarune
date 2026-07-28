"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, RefreshCw } from "lucide-react";

type ProcessNextResponse = {
  success?: boolean;
  message?: string;
  data?: {
    message?: string;
  };
};

export function ProcessNextJobButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function processNextJob() {
    setIsPending(true);
    setFeedback(null);

    try {
      const response = await fetch(
        "/api/distribution/jobs/process-next",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result =
        (await response.json()) as ProcessNextResponse;

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ??
            result.data?.message ??
            "Kuyruktaki iş çalıştırılamadı.",
        );
      }

      setFeedback({
        type: "success",
        message:
          result.message ??
          result.data?.message ??
          "Sıradaki dağıtım işi işlendi.",
      });

      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Beklenmeyen bir hata oluştu.",
      });
    } finally {
      setIsPending(false);
    }
  }

  function refreshPage() {
    setFeedback(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={refreshPage}
          type="button"
        >
          <RefreshCw className="size-4" />
          Yenile
        </button>

        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={processNextJob}
          type="button"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}

          {isPending
            ? "İşleniyor..."
            : "Sıradaki işi çalıştır"}
        </button>
      </div>

      {feedback ? (
        <p
          className={
            feedback.type === "error"
              ? "max-w-md text-xs font-medium text-red-600"
              : "max-w-md text-xs font-medium text-emerald-600"
          }
        >
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
