import { describe, expect, it } from "vitest";
import { mapCanonicalPayloadToOneRpmForm } from "@/features/distribution-automation/domain/onerpm-payload-mapper";
import type { CanonicalDistributionPayload } from "@/features/distribution-hub/domain/provider";

const payload: CanonicalDistributionPayload = {
  organizationId: "org-1",
  releaseId: "release-1",
  releaseVersion: 1,
  releaseStatus: "APPROVED",
  title: "Gece",
  isExistingRelease: false,
  releaseType: "SINGLE",
  releaseDate: new Date("2026-09-01T00:00:00.000Z"),
  artworkUrl: "https://cdn.example/artwork.jpg",
  explicit: false,
  presaveEnabled: false,
  contentIdEnabled: false,
  dolbyAtmosEnabled: false,
  artists: [
    { artistId: "artist-1", name: "Ada", role: "PRIMARY" },
    { artistId: "artist-2", name: "Mert", role: "FEATURED" },
  ],
  tracks: [{
    trackId: "track-1",
    title: "Gece",
    audioFileUrl: "https://cdn.example/audio.wav",
    explicit: false,
    contributors: [
      { name: "Ada", role: "COMPOSER" },
      { name: "Mert", role: "PRODUCER" },
    ],
  }],
  stores: [{ code: "SPOTIFY", enabled: true }, { code: "APPLE_MUSIC", enabled: false }],
  territories: ["WORLDWIDE"],
};

describe("mapCanonicalPayloadToOneRpmForm", () => {
  it("canonical payload'u browser öncesi ONErpm form modeline çevirir", () => {
    const result = mapCanonicalPayloadToOneRpmForm(payload);
    expect(result.releaseTitle).toBe("Gece");
    expect(result.primaryArtist).toBe("Ada");
    expect(result.featuredArtists).toEqual(["Mert"]);
    expect(result.releaseDate).toBe("2026-09-01");
    expect(result.stores).toEqual(["SPOTIFY"]);
    expect(result.tracks[0]?.composers).toEqual(["Ada"]);
    expect(result.tracks[0]?.producers).toEqual(["Mert"]);
  });

  it("ana sanatçı, kapak veya track yoksa browser açmadan durur", () => {
    expect(() => mapCanonicalPayloadToOneRpmForm({ ...payload, artists: [] })).toThrow("ana sanatçı");
    expect(() => mapCanonicalPayloadToOneRpmForm({ ...payload, artworkUrl: "" })).toThrow("kapak");
    expect(() => mapCanonicalPayloadToOneRpmForm({ ...payload, tracks: [] })).toThrow("en az bir parça");
  });
});
