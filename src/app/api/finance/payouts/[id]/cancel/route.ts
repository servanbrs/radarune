import { financeJson, withFinanceActor } from "@/features/finance/server/http/finance-route";
import { payoutService } from "@/features/finance/server/services/payout.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  return withFinanceActor(async (actor) => {
    const { id } = await context.params;
    const body = (await request.json()) as {
      reason: string;
    };
    const result = await payoutService.cancelPayout(actor, id, body);

    return financeJson(result, result.success ? 200 : 400);
  });
}
