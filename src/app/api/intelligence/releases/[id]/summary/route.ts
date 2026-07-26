import { intelligenceJson, withIntelligenceActor } from "@/features/intelligence/server/http/intelligence-route";
import { releaseIntelligenceService } from "@/features/intelligence/server/services/release-intelligence.service";

type SummaryRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: SummaryRouteContext) {
  return withIntelligenceActor(async (actor) => {
    const { id } = await context.params;
    const summary = await releaseIntelligenceService.getSummary(actor, id);

    return intelligenceJson({
      success: true,
      data: summary,
    });
  });
}
