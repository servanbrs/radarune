import { billingJson, withBillingActor } from "@/features/billing/server/http/billing-route";
import { checkoutService } from "@/features/billing/server/services/checkout.service";

export async function POST(request: Request) {
  return withBillingActor(async (actor) => {
    const body = (await request.json()) as {
      cancelUrl: string;
      couponCode?: string;
      planPriceId: string;
      scope: "organization" | "user";
      successUrl: string;
    };

    const result = await checkoutService.createCheckoutSession(actor, {
      planPriceId: body.planPriceId,
      cancelUrl: body.cancelUrl,
      successUrl: body.successUrl,
      ...(body.couponCode ? { couponCode: body.couponCode } : {}),
      ...(body.scope === "organization"
        ? { organizationId: actor.organizationId }
        : { userId: actor.userId }),
    });

    return billingJson(result, result.success ? 200 : 400);
  });
}
