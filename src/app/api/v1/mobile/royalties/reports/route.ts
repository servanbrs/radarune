import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { royaltyEngineService } from "@/features/finance/server/services/royalty-engine.service";

export async function GET() {
  return withMobileActor(async (actor, requestId) => {
    const reports = await royaltyEngineService.listReports(actor);

    return mobileJson(reports, requestId);
  });
}
