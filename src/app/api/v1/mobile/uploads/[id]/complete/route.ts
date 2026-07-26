import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { mobileUploadService } from "@/features/mobile/server/services/mobile-upload.service";

type UploadCompleteRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: UploadCompleteRouteContext) {
  return withMobileActor(async (actor, requestId) => {
    const { id } = await context.params;
    const upload = await mobileUploadService.complete(actor, id);

    return mobileJson(upload, requestId);
  });
}
