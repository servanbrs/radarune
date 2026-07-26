import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { mobileUploadService } from "@/features/mobile/server/services/mobile-upload.service";

type UploadRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: UploadRouteContext) {
  return withMobileActor(async (actor, requestId) => {
    const { id } = await context.params;
    const session = await mobileUploadService.get(actor, id);

    return mobileJson(session, requestId);
  });
}
