import { describe, expect, it } from "vitest";
import { recommendationService } from "@/features/growth/server/services/recommendation.service";

describe("RecommendationService", () => {
  it("yeni ve tamamlanmış adaylara deterministik skor verir", () => {
    const score = recommendationService.scoreCandidate({
      id: "release_1",
      title: "Yeni şarkı",
      primaryGenre: "Pop",
      createdAt: new Date(),
      tracks: [{ id: "track_1", title: "Parça", trackNumber: 1 }],
      artists: [{ artist: { id: "artist_1", name: "Artist", slug: "artist" } }],
      _count: { releaseLikes: 5 },
    });

    expect(score).toBeGreaterThan(10);
  });

  it("aynı sanatçıyı arka arkaya aşırı göstermemek için çeşitlendirir", () => {
    const result = recommendationService.diversifyResults([
      {
        id: "release_1",
        title: "Bir",
        primaryGenre: "Pop",
        createdAt: new Date(),
        tracks: [],
        artists: [{ artist: { id: "artist_1", name: "Artist", slug: "artist" } }],
        _count: { releaseLikes: 0 },
        score: 20,
      },
      {
        id: "release_2",
        title: "İki",
        primaryGenre: "Pop",
        createdAt: new Date(),
        tracks: [],
        artists: [{ artist: { id: "artist_1", name: "Artist", slug: "artist" } }],
        _count: { releaseLikes: 0 },
        score: 19,
      },
    ]);

    expect(result).toHaveLength(1);
  });
});
