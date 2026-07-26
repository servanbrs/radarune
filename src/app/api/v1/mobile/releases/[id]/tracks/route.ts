import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { releaseService } from "@/features/releases/server/services/release.service";

type TrackRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: TrackRouteContext) {
  return withMobileActor(async (actor, requestId) => {
    const { id } = await context.params;
    const result = await releaseService.upsertTrack(actor, id, await request.json());
    if (!result.success) {
      throw new Error(result.message);
    }

    return mobileJson(result.data, requestId, 201);
  });
}
