import { financeJson, withFinanceActor } from "@/features/finance/server/http/finance-route";
import { financialStatementService } from "@/features/finance/server/services/financial-statement.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  return withFinanceActor(async (actor) => {
    const { id } = await context.params;
    const statement = await financialStatementService.getStatementDetail(actor, id);

    if (!statement) {
      return financeJson(
        {
          success: false,
          message: "Statement bulunamadı.",
        },
        404,
      );
    }

    return financeJson({
      success: true,
      data: statement,
    });
  });
}
