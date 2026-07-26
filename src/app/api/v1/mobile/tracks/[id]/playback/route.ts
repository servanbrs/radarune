import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { mobilePlayerService } from "@/features/mobile/server/services/mobile-player.service";

type PlaybackRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: PlaybackRouteContext) {
  return withMobileActor(async (actor, requestId) => {
    const { id } = await context.params;
    const playback = await mobilePlayerService.getPlayback(actor, id);

    return mobileJson(playback, requestId);
  });
}
