import { royaltyEngineService } from "@/features/finance/server/services/royalty-engine.service";
import { financeJson, withFinanceActor } from "@/features/finance/server/http/finance-route";

export async function GET() {
  return withFinanceActor(async (actor) => {
    const reports = await royaltyEngineService.listReports(actor);

    return financeJson({
      success: true,
      data: reports,
    });
  });
}
