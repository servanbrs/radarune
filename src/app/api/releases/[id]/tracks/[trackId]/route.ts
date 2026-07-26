import { releaseJson, withReleaseActor } from "@/features/releases/server/http/release-route";
import { releaseService } from "@/features/releases/server/services/release.service";

type TrackDetailRouteContext = {
  params: Promise<{
    id: string;
    trackId: string;
  }>;
};

export async function DELETE(_request: Request, context: TrackDetailRouteContext) {
  return withReleaseActor(async (actor) => {
    const { id, trackId } = await context.params;
    const result = await releaseService.deleteTrack(actor, id, trackId);

    return releaseJson(result, result.success ? 200 : 422);
  });
}
