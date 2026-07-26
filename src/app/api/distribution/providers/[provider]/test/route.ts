import { distributionJson, withDistributionActor } from "@/features/distribution-hub/server/http/distribution-route";
import { distributionProviderConfigurationService } from "@/features/distribution-hub/server/services/provider-configuration.service";

export async function POST(
  _request: Request,
  context: {
    params: Promise<{
      provider: string;
    }>;
  },
) {
  return withDistributionActor(async (actor) => {
    const params = await context.params;
    const provider = params.provider.toUpperCase() as
      | "ONE_RPM"
      | "FUGA"
      | "SYMPHONIC"
      | "REVELATOR"
      | "INTERNAL";

    const result = await distributionProviderConfigurationService.testConnection(
      actor,
      provider,
    );

    return distributionJson(result, result.success ? 200 : 400);
  });
}
