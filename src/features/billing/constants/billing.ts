import { billingProviderValues } from "@/features/billing/domain/payment-adapter";
import { supportedCurrencyCodes } from "@/features/finance/constants/currency";

export const subscriptionStatusValues = [
  "INCOMPLETE",
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "PAYMENT_FAILED",
  "PAUSED",
  "CANCEL_AT_PERIOD_END",
  "CANCELLED",
  "EXPIRED",
] as const;

export const billingIntervalValues = ["MONTHLY", "YEARLY", "CUSTOM"] as const;

export const invoiceStatusValues = [
  "DRAFT",
  "OPEN",
  "PAID",
  "VOID",
  "UNCOLLECTIBLE",
  "REFUNDED",
] as const;

export const paymentStatusValues = [
  "REQUIRES_ACTION",
  "PENDING",
  "AUTHORIZED",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const;

export const manualPaymentRequestStatusValues = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CONFIRMED",
  "CANCELLED",
] as const;

export const couponDurationValues = ["ONCE", "REPEATING", "FOREVER"] as const;

export const supportedBillingProviderValues = billingProviderValues;
export const supportedBillingCurrencyValues = supportedCurrencyCodes;

export type BillingIntervalValue = (typeof billingIntervalValues)[number];
export type SubscriptionStatusValue = (typeof subscriptionStatusValues)[number];
export type InvoiceStatusValue = (typeof invoiceStatusValues)[number];
export type PaymentStatusValue = (typeof paymentStatusValues)[number];
