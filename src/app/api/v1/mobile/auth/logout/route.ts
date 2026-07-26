import { mobileNoContent, withMobilePublic } from "@/features/mobile/server/http/mobile-route";
import { mobileAuthService } from "@/features/mobile/server/services/mobile-auth.service";

export async function POST(request: Request) {
  return withMobilePublic(async () => {
    const body = await request.json().catch(() => ({}));
    await mobileAuthService.logout(typeof body.refreshToken === "string" ? body.refreshToken : null);

    return mobileNoContent();
  });
}
