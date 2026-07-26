import { releaseJson, withReleaseActor } from "@/features/releases/server/http/release-route";
import { releaseService } from "@/features/releases/server/services/release.service";

type ReleaseRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: ReleaseRouteContext) {
  return withReleaseActor(async (actor) => {
    const { id } = await context.params;
    const release = await releaseService.getRelease(actor, id);

    if (!release) {
      return releaseJson(
        {
          success: false,
          message: "Yayın bulunamadı.",
        },
        404,
      );
    }

    return releaseJson({
      success: true,
      data: release,
    });
  });
}

export async function PATCH(request: Request, context: ReleaseRouteContext) {
  return withReleaseActor(async (actor) => {
    const { id } = await context.params;
    const body = await request.json();
    const result = await releaseService.updateDraft(actor, id, body);

    return releaseJson(result, result.success ? 200 : 422);
  });
}
