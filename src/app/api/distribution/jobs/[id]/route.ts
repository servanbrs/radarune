import { distributionJson, withDistributionActor } from "@/features/distribution-hub/server/http/distribution-route";
import { distributionJobService } from "@/features/distribution-hub/server/services/distribution-job.service";
import { adminDistributionService } from "@/features/distribution-hub/server/services/admin-distribution.service";
import { distributionJobStatusKeys, distributionProviderKeys } from "@/features/distribution-hub/domain/provider";

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

export async function PATCH(request: Request, context: DistributionJobRouteContext) {
  return withDistributionActor(async (actor) => {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string; provider?: string; providerConfigurationId?: string | null };
    if (body.status && !distributionJobStatusKeys.includes(body.status as (typeof distributionJobStatusKeys)[number])) return distributionJson({ success: false, message: "Geçersiz job durumu." }, 422);
    if (body.provider && !distributionProviderKeys.includes(body.provider as (typeof distributionProviderKeys)[number])) return distributionJson({ success: false, message: "Geçersiz provider." }, 422);
    const data = await adminDistributionService.updateJob(actor, id, {
      ...(body.status ? { status: body.status as (typeof distributionJobStatusKeys)[number] } : {}),
      ...(body.provider ? { provider: body.provider as (typeof distributionProviderKeys)[number] } : {}),
      ...(body.providerConfigurationId !== undefined ? { providerConfigurationId: body.providerConfigurationId } : {}),
    });
    return distributionJson({ success: true, data });
  });
}
