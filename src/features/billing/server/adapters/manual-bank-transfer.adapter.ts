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

const manualCapabilities = new Set<PaymentCapability>([
  "CHECKOUT",
  "SUBSCRIPTIONS",
  "ONE_TIME_PAYMENT",
]);

function configurationRequired<T>(message: string, missingFields: string[]): PaymentAdapterResult<T> {
  return {
    success: false as const,
    code: "CONFIGURATION_REQUIRED" as const,
    message,
    missingFields,
  };
}

export class ManualBankTransferAdapter implements PaymentAdapter {
  readonly provider = "MANUAL_BANK_TRANSFER" as const;

  validateConfiguration(): PaymentAdapterValidationResult {
    return {
      ok: false,
      code: "CONFIGURATION_REQUIRED",
      missingFields: ["bankAccountName", "bankName", "iban"],
    };
  }

  supportsCapability(capability: PaymentCapability) {
    return manualCapabilities.has(capability);
  }

  async createCustomer(
    input: CreateBillingCustomerInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterCustomer>> {
    void input;
    return configurationRequired(
      "Manuel banka transferi için billing customer yapılandırması gerekli.",
      ["bankAccountName", "bankName", "iban"],
    );
  }

  async updateCustomer(
    customerId: string,
    input: CreateBillingCustomerInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterCustomer>> {
    void customerId;
    void input;
    return configurationRequired(
      "Manuel banka transferi customer güncellemesi için banka ayarı gerekli.",
      ["bankAccountName", "bankName", "iban"],
    );
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterCheckoutSession>> {
    void input;
    return configurationRequired(
      "Manuel banka transferi checkout akışı için banka hesap yapılandırması gerekli.",
      ["bankAccountName", "bankName", "iban"],
    );
  }

  async createPortalSession(
    input: CreatePortalSessionInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterPortalSession>> {
    void input;
    return {
      success: false,
      code: "UNSUPPORTED_CAPABILITY" as const,
      message: "Manuel banka transferi için customer portal desteklenmiyor.",
    };
  }

  async cancelSubscription(
    externalSubscriptionId: string,
    cancelAtPeriodEnd: boolean,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>> {
    void externalSubscriptionId;
    void cancelAtPeriodEnd;
    return configurationRequired(
      "Manuel banka transferi abonelik iptali için subscription lifecycle servisi gerekli.",
      ["manualPaymentPolicy"],
    );
  }

  async resumeSubscription(
    externalSubscriptionId: string,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>> {
    void externalSubscriptionId;
    return configurationRequired(
      "Manuel banka transferi abonelik resume akışı için lifecycle servisi gerekli.",
      ["manualPaymentPolicy"],
    );
  }

  async changeSubscription(
    input: ChangeSubscriptionInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>> {
    void input;
    return configurationRequired(
      "Manuel banka transferi plan değişikliği için lifecycle servisi gerekli.",
      ["manualPaymentPolicy"],
    );
  }

  async createRefund(
    input: RefundPaymentInput,
  ): Promise<PaymentAdapterResult<{ externalRefundId: string }>> {
    void input;
    return configurationRequired(
      "Manuel banka transferi refund akışı için manuel refund politikası gerekli.",
      ["manualRefundPolicy"],
    );
  }

  async verifyWebhook(input: {
    payload: string;
    providerSignature?: string;
  }): Promise<PaymentAdapterResult<VerifiedWebhookPayload>> {
    void input;
    return {
      success: false,
      code: "UNSUPPORTED_CAPABILITY",
      message: "Manuel banka transferi webhook desteklemiyor.",
    };
  }

  async normalizeWebhookEvent(
    event: VerifiedWebhookPayload,
  ): Promise<PaymentAdapterResult<NormalizedBillingEvent>> {
    void event;
    return {
      success: false,
      code: "UNSUPPORTED_CAPABILITY",
      message: "Manuel banka transferi normalize webhook event üretmiyor.",
    };
  }

  async getSubscription(
    externalSubscriptionId: string,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>> {
    void externalSubscriptionId;
    return configurationRequired(
      "Manuel banka transferi subscription sorgulama için iç lifecycle kaydı gerekli.",
      ["manualPaymentPolicy"],
    );
  }

  async getInvoice(
    externalInvoiceId: string,
  ): Promise<PaymentAdapterResult<PaymentAdapterInvoice>> {
    void externalInvoiceId;
    return configurationRequired(
      "Manuel banka transferi invoice sorgulama için iç invoice kaydı gerekli.",
      ["manualInvoicePolicy"],
    );
  }
}

export const manualBankTransferAdapter = new ManualBankTransferAdapter();
