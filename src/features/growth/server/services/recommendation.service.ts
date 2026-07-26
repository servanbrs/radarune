export type RecommendationCandidate = {
  id: string;
  title: string;
  primaryGenre: string;
  createdAt: Date;
  liveAt?: Date | null;
  tracks: Array<{ id: string; title: string; trackNumber: number }>;
  artists: Array<{ artist: { id: string; name: string; slug: string } }>;
  _count: { releaseLikes: number };
};

export class RecommendationService {
  scoreCandidate(candidate: RecommendationCandidate) {
    const ageDays = Math.max(1, (Date.now() - candidate.createdAt.getTime()) / 86_400_000);
    const recency = Math.max(0, 30 - ageDays);
    const popularity = Math.min(candidate._count.releaseLikes, 100) / 10;
    const trackCompleteness = candidate.tracks.length > 0 ? 10 : 0;
    return Number((recency + popularity + trackCompleteness).toFixed(4));
  }

  diversifyResults(candidates: Array<RecommendationCandidate & { score: number }>) {
    const seenArtists = new Set<string>();
    return candidates
      .sort((a, b) => b.score - a.score)
      .filter((candidate) => {
        const artistId = candidate.artists[0]?.artist.id;
        if (!artistId) {
          return true;
        }
        if (seenArtists.has(artistId)) {
          return false;
        }
        seenArtists.add(artistId);
        return true;
      });
  }
}

export const recommendationService = new RecommendationService();
