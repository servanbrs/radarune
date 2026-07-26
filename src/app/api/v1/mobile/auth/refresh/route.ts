import { mobileRefreshSchema } from "@/features/mobile/contracts/mobile-api.contract";
import { mobileJson, withMobilePublic } from "@/features/mobile/server/http/mobile-route";
import { mobileAuthService } from "@/features/mobile/server/services/mobile-auth.service";

export async function POST(request: Request) {
  return withMobilePublic(async (requestId) => {
    const input = mobileRefreshSchema.parse(await request.json());
    const session = await mobileAuthService.refresh(input);

    return mobileJson(session, requestId);
  });
}
