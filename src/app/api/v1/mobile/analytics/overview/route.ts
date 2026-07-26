import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { analyticsService } from "@/features/finance/server/services/analytics.service";

export async function GET(request: Request) {
  return withMobileActor(async (actor, requestId) => {
    const url = new URL(request.url);
    const endDate = new Date(url.searchParams.get("endDate") ?? Date.now());
    const startDate = new Date(url.searchParams.get("startDate") ?? endDate.getTime() - 28 * 86_400_000);
    const analytics = await analyticsService.getDashboard(actor, { periodStart: startDate, periodEnd: endDate });

    return mobileJson(analytics, requestId);
  });
}
