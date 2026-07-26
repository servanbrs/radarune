export const billingProviderValues = [
  "STRIPE",
  "IYZICO",
  "PAYTR",
  "MANUAL_BANK_TRANSFER",
] as const;

export const paymentCapabilityValues = [
  "CHECKOUT",
  "CUSTOMER_PORTAL",
  "SUBSCRIPTIONS",
  "ONE_TIME_PAYMENT",
  "REFUNDS",
  "PARTIAL_REFUNDS",
  "COUPONS",
  "TRIALS",
  "TAX",
  "WEBHOOKS",
] as const;

export const billingEventTypeValues = [
  "CUSTOMER_CREATED",
  "CHECKOUT_COMPLETED",
  "SUBSCRIPTION_CREATED",
  "SUBSCRIPTION_UPDATED",
  "SUBSCRIPTION_CANCELLED",
  "SUBSCRIPTION_PAUSED",
  "SUBSCRIPTION_RESUMED",
  "TRIAL_WILL_END",
  "INVOICE_CREATED",
  "INVOICE_PAID",
  "INVOICE_PAYMENT_FAILED",
  "PAYMENT_SUCCEEDED",
  "PAYMENT_FAILED",
  "REFUND_CREATED",
  "REFUND_UPDATED",
] as const;

export type BillingProvider = (typeof billingProviderValues)[number];
export type PaymentCapability = (typeof paymentCapabilityValues)[number];
export type NormalizedBillingEventType = (typeof billingEventTypeValues)[number];

export type PaymentAdapterFailureCode =
  | "CONFIGURATION_REQUIRED"
  | "UNSUPPORTED_CAPABILITY"
  | "WEBHOOK_VERIFICATION_FAILED"
  | "INVALID_REQUEST"
  | "PROVIDER_ERROR";

export type PaymentAdapterResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      code: PaymentAdapterFailureCode;
      message: string;
      missingFields?: string[];
    };

export type PaymentAdapterValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      code: "CONFIGURATION_REQUIRED";
      missingFields: string[];
    };

export type BillingScope = {
  organizationId?: string;
  userId?: string;
};

export type CreateBillingCustomerInput = BillingScope & {
  email: string;
  metadata?: Record<string, string>;
  name: string;
};

export type CreateCheckoutSessionInput = BillingScope & {
  cancelUrl: string;
  couponCode?: string;
  customerEmail: string;
  customerId?: string;
  externalPriceId: string;
  metadata?: Record<string, string>;
  successUrl: string;
  trialDays?: number;
};

export type CreatePortalSessionInput = {
  customerId: string;
  returnUrl: string;
};

export type ChangeSubscriptionInput = {
  externalPriceId: string;
  externalSubscriptionId: string;
  prorationBehavior?: "always_invoice" | "create_prorations" | "none";
};

export type RefundPaymentInput = {
  amountMinor?: bigint;
  currencyCode: "TRY" | "USD" | "EUR";
  externalPaymentId: string;
  reason?: string;
};

export type VerifyWebhookInput = {
  payload: string;
  providerSignature?: string;
};

export type PaymentAdapterCheckoutSession = {
  checkoutUrl: string;
  externalCheckoutId: string;
  expiresAt?: Date;
};

export type PaymentAdapterPortalSession = {
  portalUrl: string;
};

export type PaymentAdapterCustomer = {
  externalCustomerId: string;
};

export type PaymentAdapterSubscription = {
  externalCustomerId?: string;
  externalPriceId?: string;
  externalSubscriptionId: string;
  rawStatus: string;
};

export type PaymentAdapterInvoice = {
  amountDueMinor: bigint;
  amountPaidMinor: bigint;
  currencyCode: "TRY" | "USD" | "EUR";
  externalInvoiceId: string;
  hostedInvoiceUrl?: string;
  rawStatus: string;
};

export type VerifiedWebhookPayload = {
  eventId: string;
  occurredAt: Date;
  payload: string;
  rawType: string;
};

export type NormalizedBillingEvent = {
  eventId: string;
  externalCustomerId?: string;
  externalInvoiceId?: string;
  externalPaymentId?: string;
  externalPriceId?: string;
  externalSubscriptionId?: string;
  occurredAt: Date;
  provider: BillingProvider;
  rawPayload: string;
  rawType: string;
  type: NormalizedBillingEventType;
};

export interface PaymentAdapter {
  readonly provider: BillingProvider;

  validateConfiguration(): PaymentAdapterValidationResult;
  supportsCapability(capability: PaymentCapability): boolean;

  createCustomer(
    input: CreateBillingCustomerInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterCustomer>>;
  updateCustomer(
    customerId: string,
    input: CreateBillingCustomerInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterCustomer>>;
  createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterCheckoutSession>>;
  createPortalSession(
    input: CreatePortalSessionInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterPortalSession>>;
  cancelSubscription(
    externalSubscriptionId: string,
    cancelAtPeriodEnd: boolean,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>>;
  resumeSubscription(
    externalSubscriptionId: string,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>>;
  changeSubscription(
    input: ChangeSubscriptionInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>>;
  createRefund(
    input: RefundPaymentInput,
  ): Promise<PaymentAdapterResult<{ externalRefundId: string }>>;
  verifyWebhook(
    input: VerifyWebhookInput,
  ): Promise<PaymentAdapterResult<VerifiedWebhookPayload>>;
  normalizeWebhookEvent(
    event: VerifiedWebhookPayload,
  ): Promise<PaymentAdapterResult<NormalizedBillingEvent>>;
  getSubscription(
    externalSubscriptionId: string,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>>;
  getInvoice(
    externalInvoiceId: string,
  ): Promise<PaymentAdapterResult<PaymentAdapterInvoice>>;
}
