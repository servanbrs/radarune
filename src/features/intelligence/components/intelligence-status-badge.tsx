export function IntelligenceStatusBadge({
  status,
}: {
  status: string;
}) {
  const tone = status.includes("FAILED") || status.includes("CANCELLED")
    ? "border-rose-200 bg-rose-50 text-rose-900"
    : status.includes("COMPLETED")
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : status.includes("RUNNING") || status.includes("QUEUED")
        ? "border-sky-200 bg-sky-50 text-sky-900"
        : "border-line bg-white text-foreground";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  );
}
