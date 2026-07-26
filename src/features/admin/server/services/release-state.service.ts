export type ReleaseStatusValue =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "REVISION_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "QUEUED"
  | "PROCESSING"
  | "DISTRIBUTED"
  | "LIVE"
  | "TAKEDOWN_REQUESTED"
  | "REMOVED";

const allowedTransitions: Record<ReleaseStatusValue, readonly ReleaseStatusValue[]> = {
  DRAFT: ["PENDING_REVIEW"],
  PENDING_REVIEW: ["APPROVED", "REJECTED", "REVISION_REQUESTED"],
  REVISION_REQUESTED: ["PENDING_REVIEW"],
  APPROVED: ["QUEUED"],
  QUEUED: ["PROCESSING"],
  PROCESSING: ["DISTRIBUTED"],
  DISTRIBUTED: ["LIVE"],
  LIVE: ["TAKEDOWN_REQUESTED"],
  TAKEDOWN_REQUESTED: ["REMOVED"],
  REJECTED: [],
  REMOVED: [],
};

export class ReleaseStateService {
  canTransition(from: ReleaseStatusValue, to: ReleaseStatusValue) {
    return allowedTransitions[from].includes(to);
  }

  assertTransition(from: ReleaseStatusValue, to: ReleaseStatusValue) {
    if (!this.canTransition(from, to)) {
      throw new Error(`Geçersiz yayın durum geçişi: ${from} -> ${to}`);
    }
  }

  listTransitions() {
    return allowedTransitions;
  }
}

export const releaseStateService = new ReleaseStateService();
