import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { payoutService } from "@/features/finance/server/services/payout.service";

export async function GET() {
  return withMobileActor(async (actor, requestId) => {
    const payouts = await payoutService.listPayouts(actor);

    return mobileJson(payouts, requestId);
  });
}

export async function POST(request: Request) {
  return withMobileActor(async (actor, requestId) => {
    const result = await payoutService.requestPayout(actor, await request.json());
    if (!result.success) {
      throw new Error(result.message);
    }

    return mobileJson(result.data, requestId, 201);
  });
}
