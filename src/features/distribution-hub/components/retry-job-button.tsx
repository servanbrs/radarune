"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RetryJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/distribution/jobs/${encodeURIComponent(jobId)}/retry`, { method: "POST" });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.message ?? payload.error ?? "Job tekrar kuyruğa alınamadı.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Job tekrar kuyruğa alınamadı.");
    } finally {
      setPending(false);
    }
  }

  return <div className="flex items-center gap-2"><button className="rounded-full bg-foreground px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" disabled={pending} onClick={() => void retry()} type="button">{pending ? "Alınıyor…" : "Şimdi tekrar dene"}</button>{error ? <span className="text-xs text-red-600">{error}</span> : null}</div>;
}
