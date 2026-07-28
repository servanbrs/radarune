import { describe, expect, it } from "vitest";
import { vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/server/prisma/prisma", () => ({ prisma: {} }));
vi.mock("@/features/distribution-hub/server/provider-registry", () => ({ distributionProviderRegistry: {} }));
vi.mock("@/features/distribution-hub/server/repositories/provider-webhook-event.repository", () => ({ providerWebhookEventRepository: {} }));
vi.mock("@/features/distribution-hub/server/repositories/release-delivery.repository", () => ({ releaseDeliveryRepository: {} }));
vi.mock("@/features/distribution-hub/server/repositories/distribution-status-history.repository", () => ({ distributionStatusHistoryRepository: {} }));
vi.mock("@/features/distribution-hub/server/services/provider-configuration.service", () => ({ distributionProviderConfigurationService: {} }));
vi.mock("@/features/releases/server/repositories/release.repository", () => ({ releaseRepository: {} }));
import { isWebhookTimestampWithinWindow } from "@/features/distribution-hub/server/services/provider-webhook.service";

describe("provider webhook replay window", () => {
  const now = Date.parse("2026-07-28T12:00:00.000Z");

  it("yakın timestamp'i kabul eder", () => {
    expect(isWebhookTimestampWithinWindow(new Date(now - 60_000), now)).toBe(true);
  });

  it("eski, gelecek veya geçersiz timestamp'i reddeder", () => {
    expect(isWebhookTimestampWithinWindow(new Date(now - 25 * 60 * 60 * 1000), now)).toBe(false);
    expect(isWebhookTimestampWithinWindow(new Date(now + 6 * 60 * 1000), now)).toBe(false);
    expect(isWebhookTimestampWithinWindow(new Date("invalid"), now)).toBe(false);
  });
});
