import { distributionJson, withDistributionActor } from "@/features/distribution-hub/server/http/distribution-route";
import { distributionJobService } from "@/features/distribution-hub/server/services/distribution-job.service";

type DistributionJobRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: DistributionJobRouteContext) {
  return withDistributionActor(async (actor) => {
    const { id } = await context.params;
    const job = await distributionJobService.getJob(actor, id);

    if (!job) {
      return distributionJson(
        {
          success: false,
          message: "Distribution job bulunamadı.",
        },
        404,
      );
    }

    return distributionJson({
      success: true,
      data: job,
    });
  });
}
