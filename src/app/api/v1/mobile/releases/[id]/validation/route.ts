import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { releaseService } from "@/features/releases/server/services/release.service";

type ValidationRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ValidationRouteContext) {
  return withMobileActor(async (actor, requestId) => {
    const { id } = await context.params;
    const result = await releaseService.validateRelease(actor, id);
    if (!result.success) {
      throw new Error(result.message);
    }

    return mobileJson(result.data, requestId);
  });
}
