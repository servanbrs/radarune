import { financeJson, withFinanceActor } from "@/features/finance/server/http/finance-route";
import { financialStatementService } from "@/features/finance/server/services/financial-statement.service";

export async function GET() {
  return withFinanceActor(async (actor) => {
    const statements = await financialStatementService.listStatements(actor);

    return financeJson({
      success: true,
      data: statements,
    });
  });
}
