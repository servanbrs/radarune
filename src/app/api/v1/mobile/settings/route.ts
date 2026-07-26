import { mobileJson, withMobileActor } from "@/features/mobile/server/http/mobile-route";

export async function GET() {
  return withMobileActor(async (actor, requestId) => {
    return mobileJson(
      {
        locale: "tr-TR",
        currencyDisplay: "TRY",
        biometricLoginAvailable: true,
        account: {
          userId: actor.userId,
          organizationId: actor.organizationId,
        },
      },
      requestId,
    );
  });
}
