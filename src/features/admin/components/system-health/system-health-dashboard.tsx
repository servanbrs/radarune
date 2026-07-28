"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Database,
  KeyRound,
  Link2,
  Loader2,
  Mail,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import type {
  SystemHealthCheckResult,
  SystemHealthReport,
  SystemHealthStatus,
} from "@/features/platform/types/system-health";

type SystemHealthDashboardProps = {
  initialReport: SystemHealthReport;
};

type StatusIconProps = {
  status: SystemHealthStatus;
  className?: string;
};

type CheckIconProps = {
  checkKey: string;
  className?: string;
};

const statusLabels: Record<SystemHealthStatus, string> = {
  PASS: "Başarılı",
  WARNING: "Uyarı",
  FAIL: "Hata",
  NOT_CONFIGURED: "Yapılandırılmadı",
};

const statusClasses: Record<SystemHealthStatus, string> = {
  PASS:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  WARNING:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  FAIL:
    "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  NOT_CONFIGURED:
    "border-border bg-muted/50 text-muted-foreground",
};

function StatusIcon({
  status,
  className = "size-4",
}: StatusIconProps) {
  switch (status) {
    case "PASS":
      return (
        <CheckCircle2
          className={className}
          aria-hidden="true"
        />
      );

    case "WARNING":
      return (
        <AlertTriangle
          className={className}
          aria-hidden="true"
        />
      );

    case "FAIL":
      return (
        <XCircle
          className={className}
          aria-hidden="true"
        />
      );

    case "NOT_CONFIGURED":
      return (
        <CircleHelp
          className={className}
          aria-hidden="true"
        />
      );

    default:
      return (
        <CircleHelp
          className={className}
          aria-hidden="true"
        />
      );
  }
}

function CheckIcon({
  checkKey,
  className = "size-5",
}: CheckIconProps) {
  switch (checkKey) {
    case "database":
      return (
        <Database
          className={className}
          aria-hidden="true"
        />
      );

    case "better_auth_secret":
      return (
        <KeyRound
          className={className}
          aria-hidden="true"
        />
      );

    case "public_url":
      return (
        <Link2
          className={className}
          aria-hidden="true"
        />
      );

    case "webhook_encryption":
      return (
        <ShieldCheck
          className={className}
          aria-hidden="true"
        />
      );

    case "mail":
      return (
        <Mail
          className={className}
          aria-hidden="true"
        />
      );

    case "queue":
      return (
        <ServerCog
          className={className}
          aria-hidden="true"
        />
      );

    default:
      return (
        <CircleHelp
          className={className}
          aria-hidden="true"
        />
      );
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

function HealthCheckCard({
  check,
}: {
  check: SystemHealthCheckResult;
}) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-xl border border-border bg-muted/40 p-2.5">
            <CheckIcon checkKey={check.checkKey} />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold">{check.title}</h2>

            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {check.checkKey}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[check.status]}`}
        >
          <StatusIcon
            status={check.status}
            className="size-3.5"
          />

          {statusLabels[check.status]}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {check.message}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>{check.durationMs} ms</span>
        <span>{formatDate(check.checkedAt)}</span>
      </div>
    </article>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

export function SystemHealthDashboard({
  initialReport,
}: SystemHealthDashboardProps) {
  const [report, setReport] =
    useState<SystemHealthReport>(initialReport);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/system/health", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Sistem sağlık kontrolü başarısız oldu (${response.status}).`,
        );
      }

      const nextReport =
        (await response.json()) as SystemHealthReport;

      setReport(nextReport);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Sistem sağlık bilgileri yenilenemedi.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refresh();
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  return (
    <div className="space-y-5">
      <section className="panel overflow-hidden p-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <StatusIcon
                status={report.status}
                className="size-5"
              />

              <p className="text-sm font-medium text-muted-foreground">
                Genel sistem durumu
              </p>
            </div>

            <div className="mt-2 flex flex-wrap items-end gap-3">
              <strong className="text-5xl font-bold tracking-tight">
                %{report.score}
              </strong>

              <span
                className={`mb-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[report.status]}`}
              >
                <StatusIcon
                  status={report.status}
                  className="size-3.5"
                />

                {statusLabels[report.status]}
              </span>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              {report.ready
                ? "Zorunlu sistem bileşenleri çalışıyor."
                : "Sistemin çalışmasını etkileyen bir veya daha fazla hata var."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isRefreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? (
              <Loader2
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <RefreshCw
                className="size-4"
                aria-hidden="true"
              />
            )}

            Yenile
          </button>
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground transition-[width] duration-500"
            style={{
              width: `${Math.min(Math.max(report.score, 0), 100)}%`,
            }}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          <SummaryCard
            label="Toplam"
            value={report.totals.checks}
          />

          <SummaryCard
            label="Başarılı"
            value={report.totals.passed}
          />

          <SummaryCard
            label="Uyarı"
            value={report.totals.warnings}
          />

          <SummaryCard
            label="Hata"
            value={report.totals.failed}
          />

          <SummaryCard
            label="Yapılandırılmadı"
            value={report.totals.notConfigured}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span>
            Son kontrol: {formatDate(report.checkedAt)}
          </span>

          <span>Toplam süre: {report.durationMs} ms</span>

          <span>Otomatik yenileme: 30 saniye</span>
        </div>
      </section>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {report.checks.map((check) => (
          <HealthCheckCard
            key={check.checkKey}
            check={check}
          />
        ))}
      </section>
    </div>
  );
}
