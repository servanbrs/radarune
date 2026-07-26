import { z } from "zod";
import {
  billingIntervalValues,
  couponDurationValues,
  manualPaymentRequestStatusValues,
  paymentStatusValues,
  supportedBillingCurrencyValues,
  supportedBillingProviderValues,
  subscriptionStatusValues,
} from "@/features/billing/constants/billing";
import { billingFeatureKeys, billablePlanCodes } from "@/features/billing/constants/feature-keys";

const currencySchema = z.enum(supportedBillingCurrencyValues);
const providerSchema = z.enum(supportedBillingProviderValues);
const featureKeySchema = z.enum(billingFeatureKeys);
const billingIntervalSchema = z.enum(billingIntervalValues);
const subscriptionStatusSchema = z.enum(subscriptionStatusValues);
const paymentStatusSchema = z.enum(paymentStatusValues);

export const billingScopeSchema = z
  .object({
    organizationId: z.string().trim().min(1).optional(),
    userId: z.string().trim().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.organizationId && !value.userId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Billing scope için organizationId veya userId gerekli.",
        path: ["organizationId"],
      });
    }

    if (value.organizationId && value.userId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Billing scope aynı anda hem organization hem kullanıcı olamaz.",
        path: ["organizationId"],
      });
    }
  });

export const providerConfigSchema = z.object({
  provider: providerSchema,
  active: z.boolean(),
  displayName: z.string().trim().max(120).optional(),
  credentials: z.record(z.string(), z.string().trim().min(1)).default({}),
  publicMetadata: z.record(z.string(), z.string()).default({}),
  webhookSecret: z.string().trim().min(1).optional(),
});

export const createSubscriptionPlanSchema = z.object({
  code: z.enum(billablePlanCodes),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  active: z.boolean(),
  isPublic: z.boolean(),
  sortOrder: z.number().int().min(0),
  trialDays: z.number().int().min(0).max(365),
});

export const upsertPlanPriceSchema = z.object({
  planId: z.string().trim().min(1),
  currencyCode: currencySchema,
  amountMinor: z.bigint().min(0n),
  interval: billingIntervalSchema,
  intervalCount: z.number().int().min(1).max(120),
  provider: providerSchema,
  externalPriceId: z.string().trim().min(1).optional(),
  active: z.boolean(),
});

export const upsertPlanFeatureSchema = z
  .object({
    planId: z.string().trim().min(1),
    featureKey: featureKeySchema,
    booleanValue: z.boolean().optional(),
    integerValue: z.number().int().optional(),
    stringValue: z.string().trim().min(1).optional(),
    jsonValue: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((value, ctx) => {
    const presentCount = [
      value.booleanValue !== undefined,
      value.integerValue !== undefined,
      value.stringValue !== undefined,
      value.jsonValue !== undefined,
    ].filter(Boolean).length;

    if (presentCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Plan feature için yalnızca tek bir değer tipi verilmelidir.",
        path: ["featureKey"],
      });
    }
  });

export const createCheckoutSessionSchema = billingScopeSchema.extend({
  planPriceId: z.string().trim().min(1),
  couponCode: z.string().trim().min(1).optional(),
  successUrl: z.url("Geçerli bir successUrl girin."),
  cancelUrl: z.url("Geçerli bir cancelUrl girin."),
});

export const createManualPaymentRequestSchema = billingScopeSchema.extend({
  invoiceId: z.string().trim().min(1).optional(),
  subscriptionId: z.string().trim().min(1).optional(),
  amountMinor: z.bigint().positive(),
  currencyCode: currencySchema,
  paymentInstructions: z.string().trim().min(3).max(4000).optional(),
  notes: z.string().trim().max(1000).optional(),
  expiresAt: z.coerce.date().optional(),
});

export const updateManualPaymentRequestStatusSchema = z.object({
  status: z.enum(manualPaymentRequestStatusValues),
  notes: z.string().trim().max(1000).optional(),
});

export const createRefundSchema = z.object({
  transactionId: z.string().trim().min(1),
  amountMinor: z.bigint().positive().optional(),
  reason: z.string().trim().max(500).optional(),
});

export const subscriptionFilterSchema = z.object({
  provider: providerSchema.optional(),
  status: subscriptionStatusSchema.optional(),
});

export const invoiceFilterSchema = z.object({
  status: z.enum([
    "DRAFT",
    "OPEN",
    "PAID",
    "VOID",
    "UNCOLLECTIBLE",
    "REFUNDED",
  ] as const).optional(),
});

export const paymentTransactionFilterSchema = z.object({
  provider: providerSchema.optional(),
  status: paymentStatusSchema.optional(),
});

export const createCouponSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(500).optional(),
    percentageOffBps: z.number().int().min(1).max(10000).optional(),
    amountOffMinor: z.bigint().positive().optional(),
    currencyCode: currencySchema.optional(),
    duration: z.enum(couponDurationValues),
    durationInMonths: z.number().int().min(1).max(36).optional(),
    maxRedemptions: z.number().int().min(1).max(100000).optional(),
    active: z.boolean(),
    startsAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional(),
    planId: z.string().trim().min(1).optional(),
    provider: providerSchema.optional(),
    externalCouponId: z.string().trim().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.percentageOffBps && !value.amountOffMinor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kupon için oran veya tutar indirimi gerekli.",
        path: ["percentageOffBps"],
      });
    }

    if (value.amountOffMinor && !value.currencyCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tutar indirimi kullanılan kuponlarda currencyCode zorunludur.",
        path: ["currencyCode"],
      });
    }
  });

export type BillingScopeInput = z.infer<typeof billingScopeSchema>;
export type ProviderConfigInput = z.infer<typeof providerConfigSchema>;
export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;
export type CreateSubscriptionPlanInput = z.infer<typeof createSubscriptionPlanSchema>;
export type UpsertPlanPriceInput = z.infer<typeof upsertPlanPriceSchema>;
export type UpsertPlanFeatureInput = z.infer<typeof upsertPlanFeatureSchema>;
export type CreateManualPaymentRequestInput = z.infer<typeof createManualPaymentRequestSchema>;
export type UpdateManualPaymentRequestStatusInput = z.infer<
  typeof updateManualPaymentRequestStatusSchema
>;
export type CreateRefundInput = z.infer<typeof createRefundSchema>;
export type SubscriptionFilterInput = z.infer<typeof subscriptionFilterSchema>;
export type InvoiceFilterInput = z.infer<typeof invoiceFilterSchema>;
export type PaymentTransactionFilterInput = z.infer<typeof paymentTransactionFilterSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
