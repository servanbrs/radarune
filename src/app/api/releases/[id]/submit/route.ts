import { releaseJson, withReleaseActor } from "@/features/releases/server/http/release-route";
import { releaseService } from "@/features/releases/server/services/release.service";

type SubmitRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: SubmitRouteContext) {
  return withReleaseActor(async (actor) => {
    const { id } = await context.params;
    const result = await releaseService.submitForReview(actor, id);

    return releaseJson(result, result.success ? 200 : 422);
  });
}
