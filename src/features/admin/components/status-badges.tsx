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

const statusTranslations: Record<string, Record<string, string>> = {
  "tr-TR": { ...releaseLabels, ACTIVE: "Aktif", SUSPENDED: "Askıda", BANNED: "Yasaklı", PENDING: "Bekliyor", FAILED: "Başarısız", COMPLETED: "Tamamlandı", IMPORTED: "İçe aktarıldı", APPROVED: "Onaylandı" },
  "en-US": { DRAFT: "Draft", PENDING_REVIEW: "Pending review", REVISION_REQUESTED: "Revision requested", APPROVED: "Approved", REJECTED: "Rejected", QUEUED: "Queued", PROCESSING: "Processing", DISTRIBUTED: "Distributed", LIVE: "Live", ACTIVE: "Active", SUSPENDED: "Suspended", BANNED: "Banned", PENDING: "Pending", FAILED: "Failed", COMPLETED: "Completed", IMPORTED: "Imported" },
  "de-DE": { DRAFT: "Entwurf", PENDING_REVIEW: "Prüfung ausstehend", REVISION_REQUESTED: "Überarbeitung angefordert", APPROVED: "Genehmigt", REJECTED: "Abgelehnt", QUEUED: "Warteschlange", PROCESSING: "In Bearbeitung", DISTRIBUTED: "Verteilt", LIVE: "Live", ACTIVE: "Aktiv", SUSPENDED: "Pausiert", BANNED: "Gesperrt", PENDING: "Ausstehend", FAILED: "Fehlgeschlagen", COMPLETED: "Abgeschlossen", IMPORTED: "Importiert" },
};

export function getStatusLabel(value: string | null | undefined, locale = "tr-TR") {
  if (!value) return "—";
  return statusTranslations[locale]?.[value] ?? statusTranslations["tr-TR"]?.[value] ?? value;
}

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
      {getStatusLabel(value)}
    </span>
  );
}

export function UserRoleBadge({ value }: { value: string }) {
  return <StatusBadge value={value} />;
}

export function UserStatusBadge({ value }: { value: string }) {
  return <StatusBadge value={value === "ACTIVE" ? "Aktif" : value === "SUSPENDED" ? "Askıda" : "Yasaklı"} />;
}
