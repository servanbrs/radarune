import { financeJson, withFinanceActor } from "@/features/finance/server/http/finance-route";
import { payoutMethodService } from "@/features/finance/server/services/payout-method.service";

export async function GET() {
  return withFinanceActor(async (actor) => {
    const methods = await payoutMethodService.listMethods(actor);

    return financeJson({
      success: true,
      data: methods,
    });
  });
}

export async function POST(request: Request) {
  return withFinanceActor(async (actor) => {
    const body = (await request.json()) as {
      accountHolderName: string;
      artistId?: string;
      bankName?: string;
      iban?: string;
      labelId?: string;
      payoneerEmail?: string;
      stripeConnectAccountId?: string;
      type: "PAYONEER" | "WISE" | "IBAN" | "STRIPE_CONNECT";
      wiseRecipientId?: string;
    };

    const result = await payoutMethodService.createMethod(actor, body);

    return financeJson(result, result.success ? 200 : 400);
  });
}
