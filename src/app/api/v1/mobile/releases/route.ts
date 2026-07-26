import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { releaseService } from "@/features/releases/server/services/release.service";

export async function GET() {
  return withMobileActor(async (actor, requestId) => {
    const releases = await releaseService.listReleases(actor);

    return mobileJson(releases, requestId);
  });
}

export async function POST(request: Request) {
  return withMobileActor(async (actor, requestId) => {
    const result = await releaseService.createDraft(actor, await request.json());
    if (!result.success) {
      throw new Error(result.message);
    }

    return mobileJson(result.data, requestId, 201);
  });
}
