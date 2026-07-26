export function AdminStatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "good" | "warn" | "danger";
}) {
  const toneClass = {
    neutral: "bg-white/70",
    good: "bg-emerald-50 text-emerald-950",
    warn: "bg-amber-50 text-amber-950",
    danger: "bg-rose-50 text-rose-950",
  }[tone];

  return (
    <article className={`rounded-3xl border border-line p-5 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.22em] text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </article>
  );
}
