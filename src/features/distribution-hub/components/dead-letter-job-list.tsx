"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

type DeadLetterJob = {
  id: string;
  releaseId: string;
  releaseTitle: string;
  provider: string;
  attemptCount: number;
  maxRetryCount: number;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  updatedAt: Date | string;
};

export function DeadLetterJobList({ jobs }: { jobs: DeadLetterJob[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const requeue = (jobId: string) => {
    if (!window.confirm("Bu job tekrar kuyruğa alınsın mı? Deneme sayacı sıfırlanacaktır.")) {
      return;
    }

    setPendingId(jobId);
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/distribution/dead-letter/${encodeURIComponent(jobId)}/requeue`,
          { method: "POST" },
        );
        const payload = (await response.json()) as { error?: string; message?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Job tekrar kuyruğa alınamadı.");
        }
        setMessage(payload.message ?? "Job tekrar kuyruğa alındı.");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "İşlem tamamlanamadı.");
      } finally {
        setPendingId(null);
      }
    });
  };

  if (jobs.length === 0) {
    return (
      <section className="panel p-8 text-center">
        <p className="font-semibold">Dead-letter kuyruğu boş</p>
        <p className="mt-2 text-sm text-muted">Manuel müdahale bekleyen bir dağıtım işi bulunmuyor.</p>
      </section>
    );
  }

  return (
    <section className="panel overflow-x-auto">
      {message ? <p className="border-b border-line p-4 text-sm">{message}</p> : null}
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="p-4">Yayın</th>
            <th className="p-4">Provider</th>
            <th className="p-4">Deneme</th>
            <th className="p-4">Son hata</th>
            <th className="p-4">Güncellendi</th>
            <th className="p-4">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr className="border-b border-line last:border-0" key={job.id}>
              <td className="p-4">
                <Link className="font-semibold hover:underline" href={`/admin/distribution/jobs/${job.id}`}>
                  {job.releaseTitle}
                </Link>
              </td>
              <td className="p-4">{job.provider}</td>
              <td className="p-4">{job.attemptCount}/{job.maxRetryCount}</td>
              <td className="max-w-sm p-4">
                <p className="font-medium">{job.lastErrorCode ?? "Bilinmeyen hata"}</p>
                <p className="mt-1 truncate text-muted">{job.lastErrorMessage ?? "Hata ayrıntısı kaydedilmemiş."}</p>
              </td>
              <td className="p-4">{new Date(job.updatedAt).toLocaleString("tr-TR")}</td>
              <td className="p-4">
                <Button
                  disabled={isPending && pendingId === job.id}
                  onClick={() => requeue(job.id)}
                  size="sm"
                  type="button"
                >
                  {isPending && pendingId === job.id ? "Kuyruğa alınıyor…" : "Tekrar sıraya al"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
