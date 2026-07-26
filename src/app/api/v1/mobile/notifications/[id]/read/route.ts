import { mobileNoContent, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { mobileNotificationService } from "@/features/mobile/server/services/mobile-notification.service";

type NotificationReadRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: NotificationReadRouteContext) {
  return withMobileActor(async (actor) => {
    const { id } = await context.params;
    await mobileNotificationService.markRead(actor, id);

    return mobileNoContent();
  });
}
