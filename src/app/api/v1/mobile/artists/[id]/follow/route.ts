import { mobileNoContent, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { socialService } from "@/features/growth/server/services/social.service";

type FollowRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: FollowRouteContext) {
  return withMobileActor(async (actor) => {
    const { id } = await context.params;
    await socialService.followArtist(actor, id);

    return mobileNoContent();
  });
}

export async function DELETE(_request: Request, context: FollowRouteContext) {
  return withMobileActor(async (actor) => {
    const { id } = await context.params;
    await socialService.unfollowArtist(actor, id);

    return mobileNoContent();
  });
}
