import { financeJson, withFinanceActor } from "@/features/finance/server/http/finance-route";
import { financialAdjustmentService } from "@/features/finance/server/services/financial-adjustment.service";

export async function POST(request: Request) {
  return withFinanceActor(async (actor) => {
    const body = (await request.json()) as {
      amountMinor: string;
      currencyCode: "TRY" | "USD" | "EUR";
      direction: "CREDIT" | "DEBIT";
      reason: string;
      statementId: string;
    };

    const result = await financialAdjustmentService.createAdjustment(actor, {
      statementId: body.statementId,
      amountMinor: BigInt(body.amountMinor),
      currencyCode: body.currencyCode,
      direction: body.direction,
      reason: body.reason,
    });

    return financeJson(result, result.success ? 200 : 400);
  });
}
