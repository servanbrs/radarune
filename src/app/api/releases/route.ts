import { releaseJson, withReleaseActor } from "@/features/releases/server/http/release-route";
import { releaseService } from "@/features/releases/server/services/release.service";

export async function GET() {
  return withReleaseActor(async (actor) => {
    const releases = await releaseService.listReleases(actor);

    return releaseJson({
      success: true,
      data: releases,
    });
  });
}

export async function POST(request: Request) {
  return withReleaseActor(async (actor) => {
    const body = await request.json();
    const result = await releaseService.createDraft(actor, body);

    return releaseJson(result, result.success ? 201 : 422);
  });
}
