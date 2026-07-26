import { mobileUploadInitSchema } from "@/features/mobile/contracts/mobile-api.contract";
import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";
import { mobileUploadService } from "@/features/mobile/server/services/mobile-upload.service";

export async function POST(request: Request) {
  return withMobileActor(async (actor, requestId) => {
    const input = mobileUploadInitSchema.parse(await request.json());
    const session = await mobileUploadService.init(actor, input);

    return mobileJson(session, requestId, 201);
  });
}
