import { mobileNoContent, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { socialService } from "@/features/growth/server/services/social.service";

type LikeRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: LikeRouteContext) {
  return withMobileActor(async (actor) => {
    const { id } = await context.params;
    await socialService.like(actor, { releaseId: id });

    return mobileNoContent();
  });
}
