import { releaseStatusLabels, type ReleaseStatusValue } from "@/features/releases/constants/release.constants";
import { cn } from "@/lib/utils";

const statusTone: Record<ReleaseStatusValue, string> = {
  DRAFT: "border-line bg-surface text-muted",
  PENDING_REVIEW: "border-amber-200 bg-amber-50 text-amber-700",
  REVISION_REQUESTED: "border-orange-200 bg-orange-50 text-orange-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  QUEUED: "border-sky-200 bg-sky-50 text-sky-700",
  PROCESSING: "border-blue-200 bg-blue-50 text-blue-700",
  DISTRIBUTED: "border-teal-200 bg-teal-50 text-teal-700",
  LIVE: "border-green-200 bg-green-50 text-green-700",
  TAKEDOWN_REQUESTED: "border-zinc-300 bg-zinc-100 text-zinc-700",
  REMOVED: "border-zinc-300 bg-zinc-100 text-zinc-700",
};

export function ReleaseStatusBadge({ status }: { status: ReleaseStatusValue }) {
  return (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", statusTone[status])}>
      {releaseStatusLabels[status]}
    </span>
  );
}
