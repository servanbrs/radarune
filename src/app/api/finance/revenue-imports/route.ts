import { revenueImportService } from "@/features/finance/server/services/revenue-import.service";
import { financeJson, withFinanceActor } from "@/features/finance/server/http/finance-route";

export async function GET() {
  return withFinanceActor(async (actor) => {
    const imports = await revenueImportService.listImportsByOrganization(actor);

    return financeJson({
      success: true,
      data: imports,
    });
  });
}

export async function POST(request: Request) {
  return withFinanceActor(async (actor) => {
    const formData = await request.formData();
    const file = formData.get("file");
    const periodStart = formData.get("periodStart");
    const periodEnd = formData.get("periodEnd");
    const reportingCurrency = formData.get("reportingCurrency");

    if (!(file instanceof File) || typeof periodStart !== "string" || typeof periodEnd !== "string" || typeof reportingCurrency !== "string") {
      return financeJson(
        {
          success: false,
          message: "Revenue import için gerekli alanlar eksik.",
        },
        400,
      );
    }

    const text = await file.text();
    const result = await revenueImportService.importCsv({
      actor,
      fileName: file.name,
      mimeType: file.type || "text/csv",
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      reportingCurrency: reportingCurrency as "TRY" | "USD" | "EUR",
      text,
    });

    return financeJson(result, result.success ? 200 : 400);
  });
}
