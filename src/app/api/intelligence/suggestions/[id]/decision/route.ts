import { intelligenceJson, withIntelligenceActor } from "@/features/intelligence/server/http/intelligence-route";
import { suggestionDecisionSchema } from "@/features/intelligence/schemas/intelligence.schema";
import { aiSuggestionService } from "@/features/intelligence/server/services/ai-suggestion.service";

type SuggestionDecisionRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: SuggestionDecisionRouteContext) {
  return withIntelligenceActor(async (actor) => {
    const { id } = await context.params;
    const body = await request.json();
    const input = suggestionDecisionSchema.parse({
      ...body,
      suggestionId: id,
    });
    const result = await aiSuggestionService.decide(actor, input);

    return intelligenceJson({
      success: true,
      data: result,
    });
  });
}
