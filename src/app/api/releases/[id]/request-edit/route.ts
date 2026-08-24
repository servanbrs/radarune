import { releaseService } from "@/features/releases/server/services/release.service";
import { releaseJson, withReleaseActor } from "@/features/releases/server/http/release-route";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return withReleaseActor(async (actor) => {
    const { id } = await context.params;
    let body: { message?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      // Message is optional; an empty request is valid.
    }
    const message = typeof body.message === "string" ? body.message : undefined;
    const result = await releaseService.requestEdit(actor, id, message);
    return releaseJson(result, result.success ? 200 : 422);
  });
}
