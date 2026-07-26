import { billingJson, withBillingActor } from "@/features/billing/server/http/billing-route";
import { planCatalogService } from "@/features/billing/server/services/plan-catalog.service";

export async function GET() {
  return withBillingActor(async () => {
    const plans = await planCatalogService.listPublicPlans();

    return billingJson({
      success: true,
      data: plans,
    });
  });
}
