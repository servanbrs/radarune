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

const iyzicoCapabilities = new Set<PaymentCapability>([
  "CHECKOUT",
  "SUBSCRIPTIONS",
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

export class IyzicoPaymentAdapter implements PaymentAdapter {
  readonly provider = "IYZICO" as const;

  private getMissingFields(): string[] {
    const validation = this.validateConfiguration();
    return validation.ok ? [] : validation.missingFields;
  }

  validateConfiguration(): PaymentAdapterValidationResult {
    const missingFields = [
      !env.IYZICO_API_KEY ? "IYZICO_API_KEY" : null,
      !env.IYZICO_SECRET_KEY ? "IYZICO_SECRET_KEY" : null,
      !env.IYZICO_BASE_URL ? "IYZICO_BASE_URL" : null,
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
    return iyzicoCapabilities.has(capability);
  }

  async createCustomer(
    input: CreateBillingCustomerInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterCustomer>> {
    void input;
    return configurationRequired(
      "iyzico adapter resmi entegrasyon yapılandırması bekliyor.",
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
      "iyzico customer update entegrasyonu henüz yapılandırılmadı.",
      this.getMissingFields(),
    );
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterCheckoutSession>> {
    void input;
    return configurationRequired(
      "iyzico checkout entegrasyonu için yapılandırma gerekli.",
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
      message: "iyzico customer portal desteği sunmuyor.",
    };
  }

  async cancelSubscription(
    externalSubscriptionId: string,
    cancelAtPeriodEnd: boolean,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>> {
    void externalSubscriptionId;
    void cancelAtPeriodEnd;
    return configurationRequired(
      "iyzico subscription cancel entegrasyonu için yapılandırma gerekli.",
      this.getMissingFields(),
    );
  }

  async resumeSubscription(
    externalSubscriptionId: string,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>> {
    void externalSubscriptionId;
    return configurationRequired(
      "iyzico subscription resume entegrasyonu için yapılandırma gerekli.",
      this.getMissingFields(),
    );
  }

  async changeSubscription(
    input: ChangeSubscriptionInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>> {
    void input;
    return configurationRequired(
      "iyzico subscription change entegrasyonu için yapılandırma gerekli.",
      this.getMissingFields(),
    );
  }

  async createRefund(
    input: RefundPaymentInput,
  ): Promise<PaymentAdapterResult<{ externalRefundId: string }>> {
    void input;
    return configurationRequired(
      "iyzico refund entegrasyonu için yapılandırma gerekli.",
      this.getMissingFields(),
    );
  }

  async verifyWebhook(input: {
    payload: string;
    providerSignature?: string;
  }): Promise<PaymentAdapterResult<VerifiedWebhookPayload>> {
    void input;
    return configurationRequired(
      "iyzico webhook doğrulaması için yapılandırma gerekli.",
      this.getMissingFields(),
    );
  }

  async normalizeWebhookEvent(
    event: VerifiedWebhookPayload,
  ): Promise<PaymentAdapterResult<NormalizedBillingEvent>> {
    void event;
    return configurationRequired(
      "iyzico webhook normalize akışı için resmi event eşleştirmesi gerekli.",
      this.getMissingFields(),
    );
  }

  async getSubscription(
    externalSubscriptionId: string,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>> {
    void externalSubscriptionId;
    return configurationRequired(
      "iyzico subscription sorgulama entegrasyonu için yapılandırma gerekli.",
      this.getMissingFields(),
    );
  }

  async getInvoice(
    externalInvoiceId: string,
  ): Promise<PaymentAdapterResult<PaymentAdapterInvoice>> {
    void externalInvoiceId;
    return configurationRequired(
      "iyzico invoice sorgulama entegrasyonu için yapılandırma gerekli.",
      this.getMissingFields(),
    );
  }
}

export const iyzicoPaymentAdapter = new IyzicoPaymentAdapter();
