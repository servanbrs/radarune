import { describe, expect, it } from "vitest";
import { releaseValidatorService } from "@/features/releases/server/services/release-validator.service";

const validContributors = [
  { role: "COMPOSER" },
  { role: "LYRICIST" },
];

const validRelease = {
  type: "SINGLE" as const,
  previouslyReleased: false,
  upc: null,
  artworkUploadId: "artwork_1",
  stores: [{ storeCode: "SPOTIFY" }],
  tracks: [
    {
      id: "track_1",
      instrumental: false,
      previouslyReleased: false,
      isrc: null,
      audioUploadId: "audio_1",
      contributors: validContributors,
    },
  ],
};

describe("releaseValidatorService", () => {
  it("single yayın için tam olarak bir parça ister", () => {
    const issues = releaseValidatorService.validateForSubmit({
      ...validRelease,
      tracks: [],
    });

    expect(issues.some((issue) => issue.code === "TRACK_COUNT_SINGLE")).toBe(true);
  });

  it("daha önce dağıtılan yayında UPC ister", () => {
    const issues = releaseValidatorService.validateForSubmit({
      ...validRelease,
      previouslyReleased: true,
      upc: null,
    });

    expect(issues.some((issue) => issue.code === "UPC_REQUIRED_FOR_REDELIVERY")).toBe(true);
  });

  it("daha önce dağıtılan parçada ISRC ister", () => {
    const issues = releaseValidatorService.validateForSubmit({
      ...validRelease,
      tracks: [
        {
          id: "track_1",
          instrumental: false,
          previouslyReleased: true,
          isrc: null,
          audioUploadId: "audio_1",
          contributors: validContributors,
        },
      ],
    });

    expect(issues.some((issue) => issue.code === "ISRC_REQUIRED_FOR_REDELIVERY")).toBe(true);
  });

  it("kapak ve ses dosyası olmadan submit onayı vermez", () => {
    const issues = releaseValidatorService.validateForSubmit({
      ...validRelease,
      artworkUploadId: null,
      tracks: [
        {
          id: "track_1",
          instrumental: false,
          previouslyReleased: false,
          isrc: null,
          audioUploadId: null,
          contributors: validContributors,
        },
      ],
    });

    expect(issues.some((issue) => issue.code === "ARTWORK_REQUIRED")).toBe(true);
    expect(issues.some((issue) => issue.code === "AUDIO_REQUIRED")).toBe(true);
  });

  it("tamamlanmamış upload ile submit'i engeller", () => {
    const issues = releaseValidatorService.validateForSubmit({
      ...validRelease,
      artworkUploadStatus: "PENDING",
      tracks: [{
        id: "track_1",
        instrumental: false,
        previouslyReleased: false,
        isrc: null,
        audioUploadId: "audio_1",
        contributors: validContributors,
        audioUploadStatus: "PENDING",
      }],
    });

    expect(issues.some((issue) => issue.code === "ARTWORK_UPLOAD_NOT_READY")).toBe(true);
    expect(issues.some((issue) => issue.code === "AUDIO_UPLOAD_NOT_READY")).toBe(true);
  });

  it("besteci ve söz yazarı eksiklerini bildirir", () => {
    const issues = releaseValidatorService.validateForSubmit({
      ...validRelease,
      tracks: [
        {
          id: "track_1",
          instrumental: false,
          previouslyReleased: false,
          isrc: null,
          audioUploadId: "audio_1",
          contributors: [],
        },
      ],
    });

    expect(issues.some((issue) => issue.code === "COMPOSER_REQUIRED")).toBe(true);
    expect(issues.some((issue) => issue.code === "LYRICIST_REQUIRED")).toBe(true);
  });
});
