import { intelligenceJson, withIntelligenceActor } from "@/features/intelligence/server/http/intelligence-route";
import { releaseIntelligenceService } from "@/features/intelligence/server/services/release-intelligence.service";

export async function GET() {
  return withIntelligenceActor(async (actor) => {
    const jobs = await releaseIntelligenceService.listAdminJobs(actor);

    return intelligenceJson({
      success: true,
      data: jobs,
    });
  });
}
