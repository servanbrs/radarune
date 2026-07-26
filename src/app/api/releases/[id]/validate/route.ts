import { releaseJson, withReleaseActor } from "@/features/releases/server/http/release-route";
import { releaseService } from "@/features/releases/server/services/release.service";

type ValidateRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: ValidateRouteContext) {
  return withReleaseActor(async (actor) => {
    const { id } = await context.params;
    const result = await releaseService.validateRelease(actor, id);

    return releaseJson(result, result.success ? 200 : 422);
  });
}
