import { releaseJson, withReleaseActor } from "@/features/releases/server/http/release-route";
import { releaseService } from "@/features/releases/server/services/release.service";

type TrackRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: TrackRouteContext) {
  return withReleaseActor(async (actor) => {
    const { id } = await context.params;
    const body = await request.json();
    const result = await releaseService.upsertTrack(actor, id, body);

    return releaseJson(result, result.success ? 200 : 422);
  });
}
