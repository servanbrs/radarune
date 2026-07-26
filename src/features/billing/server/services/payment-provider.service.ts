import "server-only";
import type {
  BillingProvider,
  ChangeSubscriptionInput,
  CreateBillingCustomerInput,
  CreateCheckoutSessionInput,
  CreatePortalSessionInput,
  PaymentCapability,
  RefundPaymentInput,
  VerifyWebhookInput,
} from "@/features/billing/domain/payment-adapter";
import { billingProviderRegistry } from "@/features/billing/server/provider-registry";

export class PaymentProviderService {
  getAdapter(provider: BillingProvider) {
    return billingProviderRegistry.getAdapter(provider);
  }

  listProviders() {
    return billingProviderRegistry.listAdapters().map((adapter) => ({
      provider: adapter.provider,
      configuration: adapter.validateConfiguration(),
    }));
  }

  supportsCapability(provider: BillingProvider, capability: PaymentCapability) {
    return this.getAdapter(provider).supportsCapability(capability);
  }

  createCustomer(provider: BillingProvider, input: CreateBillingCustomerInput) {
    return this.getAdapter(provider).createCustomer(input);
  }

  updateCustomer(
    provider: BillingProvider,
    customerId: string,
    input: CreateBillingCustomerInput,
  ) {
    return this.getAdapter(provider).updateCustomer(customerId, input);
  }

  createCheckoutSession(provider: BillingProvider, input: CreateCheckoutSessionInput) {
    return this.getAdapter(provider).createCheckoutSession(input);
  }

  createPortalSession(provider: BillingProvider, input: CreatePortalSessionInput) {
    return this.getAdapter(provider).createPortalSession(input);
  }

  cancelSubscription(
    provider: BillingProvider,
    externalSubscriptionId: string,
    cancelAtPeriodEnd: boolean,
  ) {
    return this.getAdapter(provider).cancelSubscription(
      externalSubscriptionId,
      cancelAtPeriodEnd,
    );
  }

  resumeSubscription(provider: BillingProvider, externalSubscriptionId: string) {
    return this.getAdapter(provider).resumeSubscription(externalSubscriptionId);
  }

  changeSubscription(provider: BillingProvider, input: ChangeSubscriptionInput) {
    return this.getAdapter(provider).changeSubscription(input);
  }

  createRefund(provider: BillingProvider, input: RefundPaymentInput) {
    return this.getAdapter(provider).createRefund(input);
  }

  verifyWebhook(provider: BillingProvider, input: VerifyWebhookInput) {
    return this.getAdapter(provider).verifyWebhook(input);
  }
}

export const paymentProviderService = new PaymentProviderService();
