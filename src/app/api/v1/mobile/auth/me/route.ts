import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { mobileAuthService } from "@/features/mobile/server/services/mobile-auth.service";

export async function GET() {
  return withMobileActor(async (actor, requestId) => {
    const me = await mobileAuthService.me(actor);

    return mobileJson(me, requestId);
  });
}
