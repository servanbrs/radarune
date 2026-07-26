import { intelligenceJson, withIntelligenceActor } from "@/features/intelligence/server/http/intelligence-route";
import { releaseIntelligenceService } from "@/features/intelligence/server/services/release-intelligence.service";

type ValidateRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: ValidateRouteContext) {
  return withIntelligenceActor(async (actor) => {
    const { id } = await context.params;
    const result = await releaseIntelligenceService.validateRelease(actor, id);

    return intelligenceJson({
      success: true,
      data: result,
    });
  });
}
