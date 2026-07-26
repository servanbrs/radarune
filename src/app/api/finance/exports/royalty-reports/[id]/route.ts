import { financeExportService } from "@/features/finance/server/services/finance-export.service";
import { withFinanceActor } from "@/features/finance/server/http/finance-route";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  return withFinanceActor(async (actor) => {
    const url = new URL(request.url);
    const format = url.searchParams.get("format");
    const { id } = await context.params;

    if (format !== "csv" && format !== "xlsx" && format !== "pdf") {
      return new Response("Geçersiz export formatı.", {
        status: 400,
      });
    }

    const file = await financeExportService.exportRoyaltyReport(actor, id, format);

    return new Response(file.body, {
      headers: {
        "Content-Disposition": `attachment; filename="${file.fileName}"`,
        "Content-Type": file.contentType,
      },
    });
  });
}
