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
    neutral: "bg-surface text-foreground",
    good: "bg-accent/10 text-foreground",
    warn: "bg-amber-500/10 text-foreground",
    danger: "bg-danger/10 text-foreground",
  }[tone];

  const content = <>
      <p className="text-xs uppercase tracking-[0.22em] text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </>;
  const className = `block rounded-3xl border border-line p-5 shadow-[0_12px_40px_rgba(19,19,19,0.08)] ${toneClass}`;
  return href ? <Link className={`${className} transition hover:-translate-y-1 hover:border-accent`} href={href}>{content}</Link> : <article className={className}>{content}</article>;
}
