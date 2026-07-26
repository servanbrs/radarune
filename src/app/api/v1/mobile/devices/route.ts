import { mobileRegisterDeviceSchema } from "@/features/mobile/contracts/mobile-api.contract";
import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { mobileDeviceService } from "@/features/mobile/server/services/mobile-device.service";

export async function POST(request: Request) {
  return withMobileActor(async (actor, requestId) => {
    const input = mobileRegisterDeviceSchema.parse(await request.json());
    const device = await mobileDeviceService.registerDevice(actor, input);

    return mobileJson(device, requestId, 201);
  });
}
