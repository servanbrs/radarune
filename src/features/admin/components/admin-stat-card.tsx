import Link from "next/link";

export function AdminStatCard({
  label,
  value,
  tone = "neutral",
  href,
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "good" | "warn" | "danger";
  href?: string;
}) {
  const toneClass = {
    neutral: "bg-[#17272a] text-[#eef7f5]",
    good: "bg-[#12372f] text-[#a5f3d0]",
    warn: "bg-[#3b2e12] text-[#f8d98b]",
    danger: "bg-[#3b1821] text-[#ffb4c0]",
  }[tone];

  const content = <>
      <p className="text-xs uppercase tracking-[0.22em] text-[#9aada9]">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </>;
  const className = `block rounded-3xl border border-[#31484b] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)] ${toneClass}`;
  return href ? <Link className={`${className} transition hover:-translate-y-1 hover:border-[#44c7ad]`} href={href}>{content}</Link> : <article className={className}>{content}</article>;
}
