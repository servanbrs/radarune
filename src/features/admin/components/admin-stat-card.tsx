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
    neutral: "bg-[#17272a] text-[#eef7f5]",
    good: "bg-[#d9f7eb] text-[#06382d]",
    warn: "bg-[#fff6d9] text-[#5a2d00]",
    danger: "bg-[#ffe7eb] text-[#5d061d]",
  }[tone];

  return (
    <article className={`rounded-3xl border border-line p-5 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.22em] text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </article>
  );
}
