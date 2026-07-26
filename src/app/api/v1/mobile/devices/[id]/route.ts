import { mobileNoContent, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { mobileDeviceService } from "@/features/mobile/server/services/mobile-device.service";

type DeviceRouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: DeviceRouteContext) {
  return withMobileActor(async (actor) => {
    const { id } = await context.params;
    await mobileDeviceService.deleteDevice(actor, id);

    return mobileNoContent();
  });
}
