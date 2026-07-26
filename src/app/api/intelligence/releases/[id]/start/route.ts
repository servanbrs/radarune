import { intelligenceJson, withIntelligenceActor } from "@/features/intelligence/server/http/intelligence-route";
import { startReleaseIntelligenceSchema } from "@/features/intelligence/schemas/intelligence.schema";
import { releaseIntelligenceService } from "@/features/intelligence/server/services/release-intelligence.service";

type StartRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: StartRouteContext) {
  return withIntelligenceActor(async (actor) => {
    const { id } = await context.params;
    const body = await request.json();
    const input = startReleaseIntelligenceSchema.parse({
      ...body,
      releaseId: id,
    });
    const result = await releaseIntelligenceService.startAnalysis(actor, input);

    return intelligenceJson({
      success: true,
      data: result,
    });
  });
}
