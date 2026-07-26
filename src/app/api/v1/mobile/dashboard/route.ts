import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { mobileDashboardService } from "@/features/mobile/server/services/mobile-dashboard.service";

export async function GET() {
  return withMobileActor(async (actor, requestId) => {
    const dashboard = await mobileDashboardService.getDashboard(actor);

    return mobileJson(dashboard, requestId);
  });
}
