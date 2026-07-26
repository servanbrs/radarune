import { financeJson, withFinanceActor } from "@/features/finance/server/http/finance-route";
import { royaltyEngineService } from "@/features/finance/server/services/royalty-engine.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  return withFinanceActor(async (actor) => {
    const { id } = await context.params;
    const report = await royaltyEngineService.getReportDetail(actor, id);

    if (!report) {
      return financeJson(
        {
          success: false,
          message: "Royalty raporu bulunamadı.",
        },
        404,
      );
    }

    return financeJson({
      success: true,
      data: report,
    });
  });
}
