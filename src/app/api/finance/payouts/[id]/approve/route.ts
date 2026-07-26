import { financeJson, withFinanceActor } from "@/features/finance/server/http/finance-route";
import { payoutService } from "@/features/finance/server/services/payout.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  return withFinanceActor(async (actor) => {
    const { id } = await context.params;
    const result = await payoutService.approvePayout(actor, id);

    return financeJson(result, result.success ? 200 : 400);
  });
}
