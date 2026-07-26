const releaseLabels: Record<string, string> = {
  DRAFT: "Taslak",
  PENDING_REVIEW: "İncelemede",
  REVISION_REQUESTED: "Revizyon",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  QUEUED: "Kuyrukta",
  PROCESSING: "İşleniyor",
  DISTRIBUTED: "Dağıtıldı",
  LIVE: "Canlı",
  TAKEDOWN_REQUESTED: "Kaldırma Talebi",
  REMOVED: "Kaldırıldı",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
      {releaseLabels[value] ?? value}
    </span>
  );
}

export function UserRoleBadge({ value }: { value: string }) {
  return <StatusBadge value={value} />;
}

export function UserStatusBadge({ value }: { value: string }) {
  return <StatusBadge value={value === "ACTIVE" ? "Aktif" : value === "SUSPENDED" ? "Askıda" : "Yasaklı"} />;
}
