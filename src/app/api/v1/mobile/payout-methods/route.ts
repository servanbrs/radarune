import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { payoutMethodService } from "@/features/finance/server/services/payout-method.service";

export async function GET() {
  return withMobileActor(async (actor, requestId) => {
    const methods = await payoutMethodService.listMethods(actor);

    return mobileJson(methods, requestId);
  });
}
