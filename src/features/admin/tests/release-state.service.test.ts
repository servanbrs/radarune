import { describe, expect, it } from "vitest";
import { releaseStateService } from "@/features/admin/server/services/release-state.service";

describe("ReleaseStateService", () => {
  it("geçerli yayın durum geçişlerine izin verir", () => {
    const validTransitions = [
      ["DRAFT", "PENDING_REVIEW"],
      ["PENDING_REVIEW", "APPROVED"],
      ["PENDING_REVIEW", "REJECTED"],
      ["PENDING_REVIEW", "REVISION_REQUESTED"],
      ["REVISION_REQUESTED", "PENDING_REVIEW"],
      ["APPROVED", "QUEUED"],
      ["QUEUED", "PROCESSING"],
      ["PROCESSING", "DISTRIBUTED"],
      ["DISTRIBUTED", "LIVE"],
      ["LIVE", "TAKEDOWN_REQUESTED"],
      ["TAKEDOWN_REQUESTED", "REMOVED"],
    ] as const;

    for (const [from, to] of validTransitions) {
      expect(releaseStateService.canTransition(from, to)).toBe(true);
    }
  });

  it("geçersiz yayın durum geçişini engeller", () => {
    expect(() => releaseStateService.assertTransition("DRAFT", "LIVE")).toThrow(
      "Geçersiz yayın durum geçişi",
    );
  });

  it("terminal durumlarda yeni geçişe izin vermez", () => {
    expect(releaseStateService.canTransition("REJECTED", "APPROVED")).toBe(false);
    expect(releaseStateService.canTransition("REMOVED", "LIVE")).toBe(false);
  });
});
