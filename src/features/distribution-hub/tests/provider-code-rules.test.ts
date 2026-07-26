import { describe, expect, it } from "vitest";
import type { CanonicalDistributionPayload } from "@/features/distribution-hub/domain/provider";
import { validateProviderCodeRules } from "@/features/distribution-hub/server/services/provider-code-rules";

const payload: CanonicalDistributionPayload = {
  organizationId: "org_1",
  releaseId: "rel_1",
  releaseVersion: 1,
  releaseStatus: "APPROVED",
  title: "Yayın",
  isExistingRelease: false,
  releaseType: "SINGLE",
  releaseDate: new Date("2026-08-01T00:00:00.000Z"),
  artworkUrl: "storage:artwork/key.jpg",
  explicit: false,
  presaveEnabled: false,
  contentIdEnabled: false,
  dolbyAtmosEnabled: false,
  artists: [{ artistId: "artist_1", name: "Artist", role: "PRIMARY" }],
  tracks: [
    {
      trackId: "track_1",
      title: "Track",
      audioFileUrl: "storage:audio/key.wav",
      explicit: false,
      contributors: [],
    },
  ],
  stores: [{ code: "SPOTIFY", enabled: true }],
  territories: ["WW"],
};

describe("validateProviderCodeRules", () => {
  it("provider otomatik kod üretmiyorsa yeni yayın için UPC ve ISRC ister", () => {
    const issues = validateProviderCodeRules({
      payload,
      supportsAutoIsrc: false,
      supportsAutoUpc: false,
    });

    expect(issues.map((issue) => issue.code)).toEqual([
      "UPC_REQUIRED_WITH_PROVIDER",
      "ISRC_REQUIRED_WITH_PROVIDER",
    ]);
  });

  it("provider AUTO_ISRC ve AUTO_UPC destekliyorsa yeni yayında eksik kodları kabul eder", () => {
    const issues = validateProviderCodeRules({
      payload,
      supportsAutoIsrc: true,
      supportsAutoUpc: true,
    });

    expect(issues).toHaveLength(0);
  });
});
