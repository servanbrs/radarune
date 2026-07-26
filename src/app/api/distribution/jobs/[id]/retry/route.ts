import { distributionJson, withDistributionActor } from "@/features/distribution-hub/server/http/distribution-route";
import { distributionJobService } from "@/features/distribution-hub/server/services/distribution-job.service";

type DistributionJobRetryRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: DistributionJobRetryRouteContext) {
  return withDistributionActor(async (actor) => {
    const { id } = await context.params;
    const result = await distributionJobService.retryJob(actor, id);

    return distributionJson(result, result.success ? 200 : 422);
  });
}
