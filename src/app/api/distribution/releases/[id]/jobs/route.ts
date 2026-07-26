import { distributionJson, withDistributionActor } from "@/features/distribution-hub/server/http/distribution-route";
import { distributionJobService } from "@/features/distribution-hub/server/services/distribution-job.service";

type DistributionReleaseJobRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: DistributionReleaseJobRouteContext) {
  return withDistributionActor(async (actor) => {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      provider?: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL";
    };
    const result = await distributionJobService.createJobForApprovedRelease(actor, {
      releaseId: id,
      ...(body.provider ? { provider: body.provider } : {}),
    });

    return distributionJson(result, result.success ? 201 : 422);
  });
}
