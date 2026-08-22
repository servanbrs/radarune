import { releaseJson, withReleaseActor } from "@/features/releases/server/http/release-route";
import { releaseService } from "@/features/releases/server/services/release.service";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return withReleaseActor(async (actor) => {
    const { id } = await context.params;
    const result = await releaseService.updateSupplemental(actor, id, await request.json());
    return releaseJson(result, result.success ? 200 : 422);
  });
}
