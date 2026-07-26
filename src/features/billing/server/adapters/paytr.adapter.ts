import "server-only";
import {
  type ChangeSubscriptionInput,
  type CreateBillingCustomerInput,
  type CreateCheckoutSessionInput,
  type CreatePortalSessionInput,
  type NormalizedBillingEvent,
  type PaymentAdapter,
  type PaymentAdapterCheckoutSession,
  type PaymentAdapterCustomer,
  type PaymentAdapterInvoice,
  type PaymentAdapterPortalSession,
  type PaymentAdapterResult,
  type PaymentAdapterSubscription,
  type PaymentAdapterValidationResult,
  type PaymentCapability,
  type RefundPaymentInput,
  type VerifiedWebhookPayload,
} from "@/features/billing/domain/payment-adapter";
import { env } from "@/lib/env";

const paytrCapabilities = new Set<PaymentCapability>([
  "CHECKOUT",
  "ONE_TIME_PAYMENT",
  "REFUNDS",
  "WEBHOOKS",
]);

function configurationRequired<T>(message: string, missingFields: string[]): PaymentAdapterResult<T> {
  return {
    success: false as const,
    code: "CONFIGURATION_REQUIRED" as const,
    message,
    missingFields,
  };
}

export class PaytrPaymentAdapter implements PaymentAdapter {
  readonly provider = "PAYTR" as const;

  private getMissingFields(): string[] {
    const validation = this.validateConfiguration();
    return validation.ok ? [] : validation.missingFields;
  }

  validateConfiguration(): PaymentAdapterValidationResult {
    const missingFields = [
      !env.PAYTR_MERCHANT_ID ? "PAYTR_MERCHANT_ID" : null,
      !env.PAYTR_MERCHANT_KEY ? "PAYTR_MERCHANT_KEY" : null,
      !env.PAYTR_MERCHANT_SALT ? "PAYTR_MERCHANT_SALT" : null,
    ].filter((value): value is string => value !== null);

    if (missingFields.length > 0) {
      return {
        ok: false,
        code: "CONFIGURATION_REQUIRED",
        missingFields,
      };
    }

    return {
      ok: true,
    };
  }

  supportsCapability(capability: PaymentCapability) {
    return paytrCapabilities.has(capability);
  }

  async createCustomer(
    input: CreateBillingCustomerInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterCustomer>> {
    void input;
    return configurationRequired(
      "PayTR customer entegrasyonu için yapılandırma gerekli.",
      this.getMissingFields(),
    );
  }

  async updateCustomer(
    customerId: string,
    input: CreateBillingCustomerInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterCustomer>> {
    void customerId;
    void input;
    return configurationRequired(
      "PayTR customer update entegrasyonu için yapılandırma gerekli.",
      this.getMissingFields(),
    );
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterCheckoutSession>> {
    void input;
    return configurationRequired(
      "PayTR checkout entegrasyonu için yapılandırma gerekli.",
      this.getMissingFields(),
    );
  }

  async createPortalSession(
    input: CreatePortalSessionInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterPortalSession>> {
    void input;
    return {
      success: false,
      code: "UNSUPPORTED_CAPABILITY" as const,
      message: "PayTR customer portal desteği sunmuyor.",
    };
  }

  async cancelSubscription(
    externalSubscriptionId: string,
    cancelAtPeriodEnd: boolean,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>> {
    void externalSubscriptionId;
    void cancelAtPeriodEnd;
    return configurationRequired(
      "PayTR recurring subscription cancel entegrasyonu için resmi akış gerekli.",
      this.getMissingFields(),
    );
  }

  async resumeSubscription(
    externalSubscriptionId: string,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>> {
    void externalSubscriptionId;
    return configurationRequired(
      "PayTR recurring subscription resume entegrasyonu için resmi akış gerekli.",
      this.getMissingFields(),
    );
  }

  async changeSubscription(
    input: ChangeSubscriptionInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>> {
    void input;
    return configurationRequired(
      "PayTR recurring subscription change entegrasyonu için resmi akış gerekli.",
      this.getMissingFields(),
    );
  }

  async createRefund(
    input: RefundPaymentInput,
  ): Promise<PaymentAdapterResult<{ externalRefundId: string }>> {
    void input;
    return configurationRequired(
      "PayTR refund entegrasyonu için yapılandırma gerekli.",
      this.getMissingFields(),
    );
  }

  async verifyWebhook(input: {
    payload: string;
    providerSignature?: string;
  }): Promise<PaymentAdapterResult<VerifiedWebhookPayload>> {
    void input;
    return configurationRequired(
      "PayTR webhook doğrulaması için yapılandırma gerekli.",
      this.getMissingFields(),
    );
  }

  async normalizeWebhookEvent(
    event: VerifiedWebhookPayload,
  ): Promise<PaymentAdapterResult<NormalizedBillingEvent>> {
    void event;
    return configurationRequired(
      "PayTR webhook normalize akışı için resmi event eşleştirmesi gerekli.",
      this.getMissingFields(),
    );
  }

  async getSubscription(
    externalSubscriptionId: string,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>> {
    void externalSubscriptionId;
    return configurationRequired(
      "PayTR subscription sorgulama entegrasyonu için resmi akış gerekli.",
      this.getMissingFields(),
    );
  }

  async getInvoice(
    externalInvoiceId: string,
  ): Promise<PaymentAdapterResult<PaymentAdapterInvoice>> {
    void externalInvoiceId;
    return configurationRequired(
      "PayTR invoice sorgulama entegrasyonu için resmi akış gerekli.",
      this.getMissingFields(),
    );
  }
}

export const paytrPaymentAdapter = new PaytrPaymentAdapter();
