import { mobileNoContent, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { mobileAuthService } from "@/features/mobile/server/services/mobile-auth.service";

export async function POST() {
  return withMobileActor(async (actor) => {
    await mobileAuthService.logoutAll(actor);

    return mobileNoContent();
  });
}
