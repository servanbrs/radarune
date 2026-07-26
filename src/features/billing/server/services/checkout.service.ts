import "server-only";
import { randomUUID } from "node:crypto";
import { billingCustomerRepository } from "@/features/billing/server/repositories/billing-customer.repository";
import { invoiceRepository } from "@/features/billing/server/repositories/invoice.repository";
import { paymentTransactionRepository } from "@/features/billing/server/repositories/payment-transaction.repository";
import { planRepository } from "@/features/billing/server/repositories/plan.repository";
import { subscriptionRepository } from "@/features/billing/server/repositories/subscription.repository";
import { paymentProviderService } from "@/features/billing/server/services/payment-provider.service";
import {
  createCheckoutSessionSchema,
  type BillingScopeInput,
  type CreateCheckoutSessionInput,
} from "@/features/billing/schemas/billing.schema";
import { prisma } from "@/server/prisma/prisma";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { rbacService } from "@/features/authorization/server/rbac";

type CheckoutActor = FinanceActorContext & {
  email: string;
  name: string;
};

function canManageOrganizationBilling(actor: FinanceActorContext) {
  return (
    actor.membershipRole === "OWNER" ||
    actor.membershipRole === "ADMIN" ||
    rbacService.hasEffectivePermission({
      membershipRole: actor.membershipRole,
      permission: "financial-settings:update",
      systemRole: actor.systemRole,
    })
  );
}

function assertScopeAccess(actor: FinanceActorContext, scope: BillingScopeInput) {
  if (scope.organizationId) {
    if (scope.organizationId !== actor.organizationId || !canManageOrganizationBilling(actor)) {
      throw new Error("Organizasyon aboneliği başlatmak için yetkiniz yok.");
    }

    return;
  }

  if (scope.userId && scope.userId !== actor.userId) {
    throw new Error("Başka bir kullanıcı için checkout başlatamazsınız.");
  }
}

export class CheckoutService {
  async createCheckoutSession(actor: CheckoutActor, input: CreateCheckoutSessionInput) {
    const parsed = createCheckoutSessionSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false as const,
        message:
          Object.values(parsed.error.flatten().fieldErrors).flat().find(Boolean) ??
          "Checkout isteği doğrulanamadı.",
      };
    }

    assertScopeAccess(actor, parsed.data);

    const activeSubscription = await subscriptionRepository.findActiveByScope(parsed.data);

    if (activeSubscription) {
      return {
        success: false as const,
        message: "Bu scope için zaten aktif bir ana abonelik bulunuyor.",
      };
    }

    const price = await planRepository.findPriceById(parsed.data.planPriceId);

    if (!price || !price.active || !price.plan.active || !price.externalPriceId) {
      return {
        success: false as const,
        message: "Seçilen plan fiyatı checkout için uygun değil.",
      };
    }

    const existingCustomer = await billingCustomerRepository.findByScopeAndProvider(
      parsed.data,
      price.provider,
    );

    const customerResult = existingCustomer
      ? {
          success: true as const,
          data: {
            externalCustomerId: existingCustomer.externalCustomerId,
          },
        }
      : await paymentProviderService.createCustomer(price.provider, {
          ...(parsed.data.organizationId
            ? { organizationId: parsed.data.organizationId }
            : {}),
          ...(parsed.data.userId ? { userId: parsed.data.userId } : {}),
          email: actor.email,
          name: actor.name,
        });

    if (!customerResult.success) {
      return {
        success: false as const,
        message: customerResult.message,
      };
    }

    const checkoutResult = await paymentProviderService.createCheckoutSession(price.provider, {
      ...(parsed.data.organizationId ? { organizationId: parsed.data.organizationId } : {}),
      ...(parsed.data.userId ? { userId: parsed.data.userId } : {}),
      cancelUrl: parsed.data.cancelUrl,
      ...(parsed.data.couponCode ? { couponCode: parsed.data.couponCode } : {}),
      customerEmail: actor.email,
      customerId: customerResult.data.externalCustomerId,
      externalPriceId: price.externalPriceId,
      successUrl: parsed.data.successUrl,
      ...(price.plan.trialDays > 0 ? { trialDays: price.plan.trialDays } : {}),
      metadata: {
        planId: price.plan.id,
        planPriceId: price.id,
        scope: parsed.data.organizationId ? "organization" : "user",
      },
    });

    if (!checkoutResult.success) {
      return {
        success: false as const,
        message: checkoutResult.message,
      };
    }

    const scope: BillingScopeInput = parsed.data.organizationId
      ? { organizationId: parsed.data.organizationId }
      : { userId: parsed.data.userId };

    const created = await prisma.$transaction(async (tx) => {
      const billingCustomer = await billingCustomerRepository.upsertCustomer(
        {
          scope,
          provider: price.provider,
          externalCustomerId: customerResult.data.externalCustomerId,
          email: actor.email,
          name: actor.name,
        },
        tx,
      );

      const invoice = await invoiceRepository.create(
        {
          scope,
          billingCustomerId: billingCustomer.id,
          provider: price.provider,
          status: "DRAFT",
          currencyCode: price.currencyCode,
          subtotalMinor: price.amountMinor,
          totalMinor: price.amountMinor,
          amountDueMinor: price.amountMinor,
          lines: [
            {
              planId: price.plan.id,
              planPriceId: price.id,
              description: `${price.plan.name} aboneliği`,
              quantity: 1,
              unitAmountMinor: price.amountMinor,
              subtotalMinor: price.amountMinor,
              totalMinor: price.amountMinor,
            },
          ],
        },
        tx,
      );

      const subscription = await subscriptionRepository.create(
        {
          scope,
          planId: price.plan.id,
          priceId: price.id,
          billingCustomerId: billingCustomer.id,
          provider: price.provider,
          status: price.plan.trialDays > 0 ? "TRIALING" : "INCOMPLETE",
          billingInterval: price.interval,
          currencyCode: price.currencyCode,
          startedAt: new Date(),
          ...(price.plan.trialDays > 0 ? { trialStartsAt: new Date() } : {}),
          ...(price.plan.trialDays > 0
            ? {
                trialEndsAt: new Date(
                  Date.now() + price.plan.trialDays * 24 * 60 * 60 * 1000,
                ),
              }
            : {}),
        },
        tx,
      );

      const idempotencyKey = randomUUID();

      const transaction = await paymentTransactionRepository.create(
        {
          scope,
          subscriptionId: subscription.id,
          billingCustomerId: billingCustomer.id,
          invoiceId: invoice.id,
          provider: price.provider,
          status: "PENDING",
          currencyCode: price.currencyCode,
          amountMinor: price.amountMinor,
          externalCheckoutId: checkoutResult.data.externalCheckoutId,
          description: `${price.plan.name} checkout`,
          idempotencyKey,
        },
        tx,
      );

      await auditLogService.create(
        {
          organizationId: actor.organizationId,
          actorUserId: actor.userId,
          action: "billing.checkout.created",
          entityType: "PaymentTransaction",
          entityId: transaction.id,
          metadata: {
            provider: price.provider,
            planId: price.plan.id,
            planPriceId: price.id,
            checkoutId: checkoutResult.data.externalCheckoutId,
          },
        },
        tx,
      );

      return {
        invoiceId: invoice.id,
        subscriptionId: subscription.id,
        transactionId: transaction.id,
      };
    });

    return {
      success: true as const,
      data: {
        ...created,
        checkoutUrl: checkoutResult.data.checkoutUrl,
        externalCheckoutId: checkoutResult.data.externalCheckoutId,
        expiresAt: checkoutResult.data.expiresAt ?? null,
      },
    };
  }
}

export const checkoutService = new CheckoutService();
