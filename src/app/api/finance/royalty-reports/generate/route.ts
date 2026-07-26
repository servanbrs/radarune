import { financeJson, withFinanceActor } from "@/features/finance/server/http/finance-route";
import { royaltyEngineService } from "@/features/finance/server/services/royalty-engine.service";

export async function POST(request: Request) {
  return withFinanceActor(async (actor) => {
    const body = (await request.json()) as {
      periodEnd: string;
      periodStart: string;
      radaruneCommissionBps: number;
      reportingCurrency: "TRY" | "USD" | "EUR";
    };

    const result = await royaltyEngineService.generateRoyaltyReport(actor, {
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
      reportingCurrency: body.reportingCurrency,
      radaruneCommissionBps: body.radaruneCommissionBps,
    });

    return financeJson(result, result.success ? 200 : 400);
  });
}
