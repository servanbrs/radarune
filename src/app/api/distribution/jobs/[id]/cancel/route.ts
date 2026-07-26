import { distributionJson, withDistributionActor } from "@/features/distribution-hub/server/http/distribution-route";
import { distributionJobService } from "@/features/distribution-hub/server/services/distribution-job.service";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  return withDistributionActor(async (actor) => {
    const params = await context.params;
    const body = (await request.json()) as {
      reason: string;
    };

    const result = await distributionJobService.cancelJob(actor, params.id, body.reason);

    return distributionJson(result, result.success ? 200 : 400);
  });
}
