import { financeJson, withFinanceActor } from "@/features/finance/server/http/finance-route";
import { payoutService } from "@/features/finance/server/services/payout.service";

export async function POST(request: Request) {
  return withFinanceActor(async (actor) => {
    const body = (await request.json()) as {
      amountMinor: string;
      currencyCode: "TRY" | "USD" | "EUR";
      payoutMethodId: string;
      statementId: string;
    };

    const result = await payoutService.requestPayout(actor, {
      statementId: body.statementId,
      payoutMethodId: body.payoutMethodId,
      amountMinor: BigInt(body.amountMinor),
      currencyCode: body.currencyCode,
    });

    return financeJson(result, result.success ? 200 : 400);
  });
}
