import { mobilePlatformSchema } from "@/features/mobile/contracts/mobile-api.contract";
import { mobileJson, withMobilePublic } from "@/features/mobile/server/http/mobile-route";
import { mobileAppConfigService } from "@/features/mobile/server/services/mobile-app-config.service";

export async function GET(request: Request) {
  return withMobilePublic(async (requestId) => {
    const url = new URL(request.url);
    const platform = mobilePlatformSchema.parse(url.searchParams.get("platform") ?? "IOS");
    const appVersion = url.searchParams.get("appVersion") ?? "1.0.0";
    const config = await mobileAppConfigService.getConfig({ platform, appVersion });

    return mobileJson(config, requestId);
  });
}
