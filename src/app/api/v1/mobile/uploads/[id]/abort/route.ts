import { mobileNoContent, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { mobileUploadService } from "@/features/mobile/server/services/mobile-upload.service";

type UploadAbortRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: UploadAbortRouteContext) {
  return withMobileActor(async (actor) => {
    const { id } = await context.params;
    await mobileUploadService.abort(actor, id);

    return mobileNoContent();
  });
}
