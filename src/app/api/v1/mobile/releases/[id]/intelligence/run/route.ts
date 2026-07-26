import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { startReleaseIntelligenceSchema } from "@/features/intelligence/schemas/intelligence.schema";
import { releaseIntelligenceService } from "@/features/intelligence/server/services/release-intelligence.service";

type IntelligenceRunRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: IntelligenceRunRouteContext) {
  return withMobileActor(async (actor, requestId) => {
    const { id } = await context.params;
    const input = startReleaseIntelligenceSchema.parse({ ...(await request.json()), releaseId: id });
    const result = await releaseIntelligenceService.startAnalysis(actor, input);

    return mobileJson(result, requestId, 201);
  });
}
