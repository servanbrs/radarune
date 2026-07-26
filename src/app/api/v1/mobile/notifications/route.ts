import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { mobileNotificationService } from "@/features/mobile/server/services/mobile-notification.service";

export async function GET() {
  return withMobileActor(async (actor, requestId) => {
    const notifications = await mobileNotificationService.list(actor);

    return mobileJson(notifications, requestId);
  });
}
