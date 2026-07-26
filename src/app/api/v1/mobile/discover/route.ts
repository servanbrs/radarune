import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { discoverService } from "@/features/growth/server/services/discover.service";

export async function GET() {
  return withMobileActor(async (actor, requestId) => {
    const candidates = await discoverService.getCandidates(actor);

    return mobileJson(candidates, requestId);
  });
}
