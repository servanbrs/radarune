import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { royaltyEngineService } from "@/features/finance/server/services/royalty-engine.service";

type RoyaltyReportRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RoyaltyReportRouteContext) {
  return withMobileActor(async (actor, requestId) => {
    const { id } = await context.params;
    const report = await royaltyEngineService.getReportDetail(actor, id);
    if (!report) {
      throw new Error("Royalty raporu bulunamadı.");
    }

    return mobileJson(report, requestId);
  });
}
