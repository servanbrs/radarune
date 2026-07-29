import { intelligenceJson, withIntelligenceActor } from "@/features/intelligence/server/http/intelligence-route";
import { releaseIntelligenceService } from "@/features/intelligence/server/services/release-intelligence.service";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  return withIntelligenceActor(async (actor) => {
    const { id } = await context.params;
    const data = await releaseIntelligenceService.getSubmissionAssistant(actor, id);
    return intelligenceJson({ success: true, data });
  });
}
