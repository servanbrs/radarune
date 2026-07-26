import { describe, expect, it } from "vitest";
import { releaseStateService } from "@/features/admin/server/services/release-state.service";

describe("ReleaseStateService", () => {
  it("geçerli yayın durum geçişlerine izin verir", () => {
    expect(releaseStateService.canTransition("PENDING_REVIEW", "APPROVED")).toBe(true);
    expect(releaseStateService.canTransition("APPROVED", "QUEUED")).toBe(true);
  });

  it("geçersiz yayın durum geçişini engeller", () => {
    expect(() => releaseStateService.assertTransition("DRAFT", "LIVE")).toThrow(
      "Geçersiz yayın durum geçişi",
    );
  });
});
