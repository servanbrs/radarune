import { financeExportService } from "@/features/finance/server/services/finance-export.service";
import { withFinanceActor } from "@/features/finance/server/http/finance-route";

export async function GET(request: Request) {
  return withFinanceActor(async (actor) => {
    const url = new URL(request.url);
    const format = url.searchParams.get("format");

    if (format !== "csv" && format !== "xlsx" && format !== "pdf") {
      return new Response("Geçersiz export formatı.", {
        status: 400,
      });
    }

    const file = await financeExportService.exportStatements(actor, format);

    return new Response(file.body, {
      headers: {
        "Content-Disposition": `attachment; filename="${file.fileName}"`,
        "Content-Type": file.contentType,
      },
    });
  });
}
