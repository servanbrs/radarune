import { entitlementService } from "@/features/billing/server/services/entitlement.service";
import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";

const mobileFeatureKeys = [
  "mobile.releases.enabled",
  "mobile.uploads.enabled",
  "mobile.discover.enabled",
  "mobile.player.enabled",
  "mobile.payouts.enabled",
  "mobile.presave.enabled",
  "mobile.intelligence.enabled",
  "mobile.social.enabled",
] as const;

export async function GET() {
  return withMobileActor(async (actor, requestId) => {
    const features = await entitlementService.getFeatureMap({
      organizationId: actor.organizationId,
      userId: actor.userId,
    });

    return mobileJson(
      Object.fromEntries(mobileFeatureKeys.map((key) => [key, features.get(key) ?? true])),
      requestId,
    );
  });
}
