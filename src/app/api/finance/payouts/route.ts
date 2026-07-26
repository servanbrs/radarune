import { financeJson, withFinanceActor } from "@/features/finance/server/http/finance-route";
import { payoutService } from "@/features/finance/server/services/payout.service";

export async function GET() {
  return withFinanceActor(async (actor) => {
    const payouts = await payoutService.listPayouts(actor);

    return financeJson({
      success: true,
      data: payouts,
    });
  });
}
