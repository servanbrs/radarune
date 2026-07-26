import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { discoverService } from "@/features/growth/server/services/discover.service";

export async function POST(request: Request) {
  return withMobileActor(async (actor, requestId) => {
    const event = await discoverService.recordEvent(actor, await request.json());

    return mobileJson(event, requestId, 201);
  });
}
