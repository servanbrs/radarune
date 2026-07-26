import { distributionJson, withDistributionActor } from "@/features/distribution-hub/server/http/distribution-route";
import { distributionProcessorService } from "@/features/distribution-hub/server/services/distribution-processor.service";

export async function POST() {
  return withDistributionActor(async (actor) => {
    const result = await distributionProcessorService.processNextJob(
      `manual:${actor.userId}`,
    );

    return distributionJson(result, result.success ? 200 : 400);
  });
}
