import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";
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
  type PaymentAdapterResult,
  type PaymentAdapterSubscription,
  type PaymentAdapterValidationResult,
  type PaymentCapability,
  type RefundPaymentInput,
  type VerifyWebhookInput,
  type VerifiedWebhookPayload,
} from "@/features/billing/domain/payment-adapter";

const stripeCapabilities = new Set<PaymentCapability>([
  "CHECKOUT",
  "CUSTOMER_PORTAL",
  "SUBSCRIPTIONS",
  "REFUNDS",
  "PARTIAL_REFUNDS",
  "COUPONS",
  "TRIALS",
  "TAX",
  "WEBHOOKS",
]);

function toMinorAmount(value: number | null | undefined) {
  return BigInt(value ?? 0);
}

function mapStripeEventType(type: string): NormalizedBillingEvent["type"] | null {
  switch (type) {
    case "checkout.session.completed":
      return "CHECKOUT_COMPLETED";
    case "customer.created":
      return "CUSTOMER_CREATED";
    case "customer.subscription.created":
      return "SUBSCRIPTION_CREATED";
    case "customer.subscription.updated":
      return "SUBSCRIPTION_UPDATED";
    case "customer.subscription.deleted":
      return "SUBSCRIPTION_CANCELLED";
    case "invoice.created":
      return "INVOICE_CREATED";
    case "invoice.paid":
      return "INVOICE_PAID";
    case "invoice.payment_failed":
      return "INVOICE_PAYMENT_FAILED";
    case "charge.refunded":
      return "REFUND_UPDATED";
    case "refund.created":
      return "REFUND_CREATED";
    default:
      return null;
  }
}

function configurationRequired<T>(missingFields: string[], message: string): PaymentAdapterResult<T> {
  return {
    success: false,
    code: "CONFIGURATION_REQUIRED",
    message,
    missingFields,
  };
}

export class StripePaymentAdapter implements PaymentAdapter {
  readonly provider = "STRIPE" as const;

  private getClient() {
    if (!env.STRIPE_SECRET_KEY) {
      return null;
    }

    return new Stripe(env.STRIPE_SECRET_KEY, {
      appInfo: {
        name: "Radarune",
      },
    });
  }

  validateConfiguration(): PaymentAdapterValidationResult {
    const missingFields = [
      !env.STRIPE_SECRET_KEY ? "STRIPE_SECRET_KEY" : null,
      !env.BILLING_SUCCESS_URL ? "BILLING_SUCCESS_URL" : null,
      !env.BILLING_CANCEL_URL ? "BILLING_CANCEL_URL" : null,
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
    return stripeCapabilities.has(capability);
  }

  async createCustomer(
    input: CreateBillingCustomerInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterCustomer>> {
    const client = this.getClient();
    const validation = this.validateConfiguration();

    if (!client || !validation.ok) {
      return configurationRequired(
        validation.ok ? ["STRIPE_SECRET_KEY"] : validation.missingFields,
        "Stripe yapılandırması eksik.",
      );
    }

    const customer = await client.customers.create({
      email: input.email,
      name: input.name,
      ...(input.metadata ? { metadata: input.metadata } : {}),
    });

    return {
      success: true,
      data: {
        externalCustomerId: customer.id,
      },
    };
  }

  async updateCustomer(
    customerId: string,
    input: CreateBillingCustomerInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterCustomer>> {
    const client = this.getClient();
    const validation = this.validateConfiguration();

    if (!client || !validation.ok) {
      return configurationRequired(
        validation.ok ? ["STRIPE_SECRET_KEY"] : validation.missingFields,
        "Stripe yapılandırması eksik.",
      );
    }

    const customer = await client.customers.update(customerId, {
      email: input.email,
      name: input.name,
      ...(input.metadata ? { metadata: input.metadata } : {}),
    });

    return {
      success: true,
      data: {
        externalCustomerId: customer.id,
      },
    };
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterCheckoutSession>> {
    const client = this.getClient();
    const validation = this.validateConfiguration();

    if (!client || !validation.ok) {
      return configurationRequired(
        validation.ok ? ["STRIPE_SECRET_KEY"] : validation.missingFields,
        "Stripe checkout için yapılandırma eksik.",
      );
    }

    const session = await client.checkout.sessions.create({
      mode: "subscription",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      line_items: [
        {
          price: input.externalPriceId,
          quantity: 1,
        },
      ],
      ...(input.customerId
        ? { customer: input.customerId }
        : { customer_email: input.customerEmail }),
      ...(input.couponCode
        ? {
            discounts: [
              {
                promotion_code: input.couponCode,
              },
            ],
          }
        : {}),
      ...((input.trialDays ?? input.metadata)
        ? {
            subscription_data: {
              ...(typeof input.trialDays === "number"
                ? { trial_period_days: input.trialDays }
                : {}),
              ...(input.metadata ? { metadata: input.metadata } : {}),
            },
          }
        : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
    });

    if (!session.url) {
      return {
        success: false,
        code: "PROVIDER_ERROR",
        message: "Stripe checkout URL üretmedi.",
      };
    }

    return {
      success: true,
      data: {
        checkoutUrl: session.url,
        externalCheckoutId: session.id,
        ...(session.expires_at
          ? { expiresAt: new Date(session.expires_at * 1000) }
          : {}),
      },
    };
  }

  async createPortalSession(
    input: CreatePortalSessionInput,
  ): Promise<PaymentAdapterResult<{ portalUrl: string }>> {
    const client = this.getClient();

    if (!client) {
      return configurationRequired(["STRIPE_SECRET_KEY"], "Stripe yapılandırması eksik.");
    }

    const session = await client.billingPortal.sessions.create({
      customer: input.customerId,
      return_url: input.returnUrl,
    });

    return {
      success: true,
      data: {
        portalUrl: session.url,
      },
    };
  }

  async cancelSubscription(
    externalSubscriptionId: string,
    cancelAtPeriodEnd: boolean,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>> {
    const client = this.getClient();

    if (!client) {
      return configurationRequired(["STRIPE_SECRET_KEY"], "Stripe yapılandırması eksik.");
    }

    const subscription = await client.subscriptions.update(externalSubscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    return this.mapSubscription(subscription);
  }

  async resumeSubscription(
    externalSubscriptionId: string,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>> {
    const client = this.getClient();

    if (!client) {
      return configurationRequired(["STRIPE_SECRET_KEY"], "Stripe yapılandırması eksik.");
    }

    const subscription = await client.subscriptions.update(externalSubscriptionId, {
      cancel_at_period_end: false,
    });

    return this.mapSubscription(subscription);
  }

  async changeSubscription(
    input: ChangeSubscriptionInput,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>> {
    const client = this.getClient();

    if (!client) {
      return configurationRequired(["STRIPE_SECRET_KEY"], "Stripe yapılandırması eksik.");
    }

    const subscription = await client.subscriptions.retrieve(input.externalSubscriptionId);
    const firstItem = subscription.items.data[0];

    if (!firstItem) {
      return {
        success: false,
        code: "INVALID_REQUEST",
        message: "Stripe subscription item bulunamadı.",
      };
    }

    const updated = await client.subscriptions.update(input.externalSubscriptionId, {
      items: [
        {
          id: firstItem.id,
          price: input.externalPriceId,
        },
      ],
      ...(input.prorationBehavior
        ? { proration_behavior: input.prorationBehavior }
        : {}),
    });

    return this.mapSubscription(updated);
  }

  async createRefund(
    input: RefundPaymentInput,
  ): Promise<PaymentAdapterResult<{ externalRefundId: string }>> {
    const client = this.getClient();

    if (!client) {
      return configurationRequired(["STRIPE_SECRET_KEY"], "Stripe yapılandırması eksik.");
    }

    const refund = await client.refunds.create({
      payment_intent: input.externalPaymentId,
      ...(typeof input.amountMinor === "bigint"
        ? { amount: Number(input.amountMinor) }
        : {}),
      ...(input.reason === "fraudulent" ? { reason: "fraudulent" } : {}),
    });

    return {
      success: true,
      data: {
        externalRefundId: refund.id,
      },
    };
  }

  async verifyWebhook(
    input: VerifyWebhookInput,
  ): Promise<PaymentAdapterResult<VerifiedWebhookPayload>> {
    const client = this.getClient();

    if (!client || !env.STRIPE_WEBHOOK_SECRET) {
      return {
        success: false,
        code: "CONFIGURATION_REQUIRED",
        message: "Stripe webhook doğrulama yapılandırması eksik.",
        missingFields: [
          !env.STRIPE_SECRET_KEY ? "STRIPE_SECRET_KEY" : null,
          !env.STRIPE_WEBHOOK_SECRET ? "STRIPE_WEBHOOK_SECRET" : null,
        ].filter((value): value is string => value !== null),
      };
    }

    if (!input.providerSignature) {
      return {
        success: false,
        code: "WEBHOOK_VERIFICATION_FAILED",
        message: "Stripe signature header eksik.",
      };
    }

    try {
      const event = client.webhooks.constructEvent(
        input.payload,
        input.providerSignature,
        env.STRIPE_WEBHOOK_SECRET,
      );

      return {
        success: true,
        data: {
          eventId: event.id,
          occurredAt: new Date((event.created ?? Math.floor(Date.now() / 1000)) * 1000),
          payload: input.payload,
          rawType: event.type,
        },
      };
    } catch {
      return {
        success: false,
        code: "WEBHOOK_VERIFICATION_FAILED",
        message: "Stripe webhook signature doğrulanamadı.",
      };
    }
  }

  async normalizeWebhookEvent(
    event: VerifiedWebhookPayload,
  ): Promise<PaymentAdapterResult<NormalizedBillingEvent>> {
    const mapped = mapStripeEventType(event.rawType);

    if (!mapped) {
      return {
        success: false,
        code: "UNSUPPORTED_CAPABILITY",
        message: `Stripe event tipi henüz normalize edilmiyor: ${event.rawType}`,
      };
    }

    return {
      success: true,
      data: {
        eventId: event.eventId,
        occurredAt: event.occurredAt,
        provider: this.provider,
        rawPayload: event.payload,
        rawType: event.rawType,
        type: mapped,
      },
    };
  }

  async getSubscription(
    externalSubscriptionId: string,
  ): Promise<PaymentAdapterResult<PaymentAdapterSubscription>> {
    const client = this.getClient();

    if (!client) {
      return configurationRequired(["STRIPE_SECRET_KEY"], "Stripe yapılandırması eksik.");
    }

    const subscription = await client.subscriptions.retrieve(externalSubscriptionId);
    return this.mapSubscription(subscription);
  }

  async getInvoice(
    externalInvoiceId: string,
  ): Promise<PaymentAdapterResult<PaymentAdapterInvoice>> {
    const client = this.getClient();

    if (!client) {
      return configurationRequired(["STRIPE_SECRET_KEY"], "Stripe yapılandırması eksik.");
    }

    const invoice = await client.invoices.retrieve(externalInvoiceId);

    const currencyCode = invoice.currency.toUpperCase();
    if (currencyCode !== "TRY" && currencyCode !== "USD" && currencyCode !== "EUR") {
      return {
        success: false,
        code: "INVALID_REQUEST",
        message: `Desteklenmeyen Stripe invoice currency: ${invoice.currency}`,
      };
    }

    const data: PaymentAdapterInvoice = {
      externalInvoiceId: invoice.id,
      amountDueMinor: toMinorAmount(invoice.amount_due),
      amountPaidMinor: toMinorAmount(invoice.amount_paid),
      currencyCode,
      rawStatus: invoice.status ?? "unknown",
      ...(invoice.hosted_invoice_url
        ? { hostedInvoiceUrl: invoice.hosted_invoice_url }
        : {}),
    };

    return {
      success: true,
      data,
    };
  }

  private mapSubscription(
    subscription: Stripe.Subscription,
  ): PaymentAdapterResult<PaymentAdapterSubscription> {
    const firstItem = subscription.items.data[0];

    return {
      success: true,
      data: {
        externalSubscriptionId: subscription.id,
        rawStatus: subscription.status,
        ...(typeof subscription.customer === "string"
          ? { externalCustomerId: subscription.customer }
          : {}),
        ...(firstItem?.price.id ? { externalPriceId: firstItem.price.id } : {}),
      },
    };
  }
}

export const stripePaymentAdapter = new StripePaymentAdapter();
