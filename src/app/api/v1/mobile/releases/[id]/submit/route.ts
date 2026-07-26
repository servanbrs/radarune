import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { releaseService } from "@/features/releases/server/services/release.service";

type SubmitRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: SubmitRouteContext) {
  return withMobileActor(async (actor, requestId) => {
    const { id } = await context.params;
    const result = await releaseService.submitForReview(actor, id);
    if (!result.success) {
      throw new Error(result.message);
    }

    return mobileJson(result.data, requestId);
  });
}
