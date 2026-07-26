import { billingJson, withBillingActor } from "@/features/billing/server/http/billing-route";
import { subscriptionService } from "@/features/billing/server/services/subscription.service";

export async function GET(request: Request) {
  return withBillingActor(async (actor) => {
    const { searchParams } = new URL(request.url);
    const scopeType = searchParams.get("scope") === "user" ? "user" : "organization";

    const result = await subscriptionService.listSubscriptions(
      actor,
      scopeType === "organization"
        ? { organizationId: actor.organizationId }
        : { userId: actor.userId },
      {},
    );

    return billingJson(result, result.success ? 200 : 400);
  });
}
