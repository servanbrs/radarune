import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { releaseIntelligenceService } from "@/features/intelligence/server/services/release-intelligence.service";

type IntelligenceRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: IntelligenceRouteContext) {
  return withMobileActor(async (actor, requestId) => {
    const { id } = await context.params;
    const summary = await releaseIntelligenceService.getSummary(actor, id);

    return mobileJson(summary, requestId);
  });
}
