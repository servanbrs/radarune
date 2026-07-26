import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { releaseService } from "@/features/releases/server/services/release.service";

type ReleaseRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ReleaseRouteContext) {
  return withMobileActor(async (actor, requestId) => {
    const { id } = await context.params;
    const release = await releaseService.getRelease(actor, id);
    if (!release) {
      throw new Error("Yayın bulunamadı.");
    }

    return mobileJson(release, requestId);
  });
}

export async function PATCH(request: Request, context: ReleaseRouteContext) {
  return withMobileActor(async (actor, requestId) => {
    const { id } = await context.params;
    const result = await releaseService.updateDraft(actor, id, await request.json());
    if (!result.success) {
      throw new Error(result.message);
    }

    return mobileJson(result.data, requestId);
  });
}
