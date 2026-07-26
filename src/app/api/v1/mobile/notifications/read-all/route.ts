import { mobileNoContent, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { mobileNotificationService } from "@/features/mobile/server/services/mobile-notification.service";

export async function POST() {
  return withMobileActor(async (actor) => {
    await mobileNotificationService.markAllRead(actor);

    return mobileNoContent();
  });
}
