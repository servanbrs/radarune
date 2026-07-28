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
    good: "bg-[#12372f] text-[#a5f3d0]",
    warn: "bg-[#3b2e12] text-[#f8d98b]",
    danger: "bg-[#3b1821] text-[#ffb4c0]",
  }[tone];

  return (
    <article className={`rounded-3xl border border-[#31484b] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)] ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.22em] text-[#9aada9]">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </article>
  );
}
