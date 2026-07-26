import { billingJson, withBillingActor } from "@/features/billing/server/http/billing-route";
import { paymentProviderConfigService } from "@/features/billing/server/services/payment-provider-config.service";

export async function GET() {
  return withBillingActor(async (actor) => {
    const configs = await paymentProviderConfigService.listByOrganization(actor);

    return billingJson({
      success: true,
      data: configs,
    });
  });
}

export async function POST(request: Request) {
  return withBillingActor(async (actor) => {
    const body = (await request.json()) as {
      active: boolean;
      credentials?: Record<string, string>;
      displayName?: string;
      provider: "STRIPE" | "IYZICO" | "PAYTR" | "MANUAL_BANK_TRANSFER";
      publicMetadata?: Record<string, string>;
      webhookSecret?: string;
    };

    const result = await paymentProviderConfigService.upsert(actor, {
      provider: body.provider,
      active: body.active,
      ...(body.displayName ? { displayName: body.displayName } : {}),
      credentials: body.credentials ?? {},
      publicMetadata: body.publicMetadata ?? {},
      ...(body.webhookSecret ? { webhookSecret: body.webhookSecret } : {}),
    });

    return billingJson(result, result.success ? 200 : 400);
  });
}
