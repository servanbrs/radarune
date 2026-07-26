import { playbackEventSchema } from "@/features/mobile/contracts/mobile-api.contract";
import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { mobilePlayerService } from "@/features/mobile/server/services/mobile-player.service";

export async function POST(request: Request) {
  return withMobileActor(async (actor, requestId) => {
    const input = playbackEventSchema.parse(await request.json());
    const event = await mobilePlayerService.recordEvent(actor, input);

    return mobileJson(event, requestId, 201);
  });
}
