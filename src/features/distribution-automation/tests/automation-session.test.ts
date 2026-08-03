import { describe, expect, it } from "vitest";

import {
  createEmptyAutomationSession,
  isHumanActionRequired,
} from "@/features/distribution-automation/domain/automation-session";

describe("ONErpm automation session", () => {
  it("başlangıç durumunu bağlı değil olarak oluşturur", () => {
    expect(createEmptyAutomationSession()).toEqual({
      provider: "ONE_RPM",
      status: "NOT_CONNECTED",
      storageStatePath: null,
      connectedAt: null,
      lastCheckedAt: null,
      expiresAt: null,
      lastError: null,
    });
  });

  it("2FA ve son onay adımlarını insan işlemi olarak işaretler", () => {
    expect(isHumanActionRequired("WAITING_2FA")).toBe(true);
    expect(isHumanActionRequired("WAITING_FINAL_APPROVAL")).toBe(true);
    expect(isHumanActionRequired("UPLOADING_AUDIO")).toBe(false);
  });
});
