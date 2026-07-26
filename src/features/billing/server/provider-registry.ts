import "server-only";
import type { BillingProvider, PaymentAdapter } from "@/features/billing/domain/payment-adapter";
import { iyzicoPaymentAdapter } from "@/features/billing/server/adapters/iyzico.adapter";
import { manualBankTransferAdapter } from "@/features/billing/server/adapters/manual-bank-transfer.adapter";
import { paytrPaymentAdapter } from "@/features/billing/server/adapters/paytr.adapter";
import { stripePaymentAdapter } from "@/features/billing/server/adapters/stripe.adapter";

const adapters = [
  stripePaymentAdapter,
  iyzicoPaymentAdapter,
  paytrPaymentAdapter,
  manualBankTransferAdapter,
] as const satisfies readonly PaymentAdapter[];

export class BillingProviderRegistry {
  private readonly adapterMap = new Map<BillingProvider, PaymentAdapter>(
    adapters.map((adapter) => [adapter.provider, adapter]),
  );

  getAdapter(provider: BillingProvider) {
    const adapter = this.adapterMap.get(provider);

    if (!adapter) {
      throw new Error(`Billing provider adapter bulunamadı: ${provider}`);
    }

    return adapter;
  }

  listAdapters() {
    return [...this.adapterMap.values()];
  }
}

export const billingProviderRegistry = new BillingProviderRegistry();
