import "server-only";
import { prisma } from "@/server/prisma/prisma";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import type { BillingScopeInput, SubscriptionFilterInput } from "@/features/billing/schemas/billing.schema";
import { subscriptionFilterSchema } from "@/features/billing/schemas/billing.schema";
import { subscriptionRepository } from "@/features/billing/server/repositories/subscription.repository";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { rbacService } from "@/features/authorization/server/rbac";

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

export class SubscriptionService {
  private assertScopeAccess(actor: FinanceActorContext, scope: BillingScopeInput) {
    if (scope.organizationId) {
      if (scope.organizationId !== actor.organizationId || !canManageOrganizationBilling(actor)) {
        throw new Error("Organizasyon aboneliğini yönetmek için yetkiniz yok.");
      }

      return;
    }

    if (scope.userId && scope.userId !== actor.userId) {
      throw new Error("Başka bir kullanıcının aboneliğini görüntüleyemezsiniz.");
    }
  }

  async listSubscriptions(
    actor: FinanceActorContext,
    scope: BillingScopeInput,
    filters: SubscriptionFilterInput,
  ) {
    this.assertScopeAccess(actor, scope);

    const parsed = subscriptionFilterSchema.safeParse(filters);

    if (!parsed.success) {
      return {
        success: false as const,
        message:
          Object.values(parsed.error.flatten().fieldErrors).flat().find(Boolean) ??
          "Abonelik filtreleri doğrulanamadı.",
      };
    }

    const subscriptions = await subscriptionRepository.listByScope(scope);
    const filtered = subscriptions.filter((subscription) => {
      if (parsed.data.provider && subscription.provider !== parsed.data.provider) {
        return false;
      }

      if (parsed.data.status && subscription.status !== parsed.data.status) {
        return false;
      }

      return true;
    });

    return {
      success: true as const,
      data: filtered,
    };
  }

  async syncSubscriptionLifecycle(input: {
    actorUserId?: string;
    scope: BillingScopeInput;
    subscriptionId: string;
    status: "INCOMPLETE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "PAYMENT_FAILED" | "PAUSED" | "CANCEL_AT_PERIOD_END" | "CANCELLED" | "EXPIRED";
    externalStatus?: string | null;
    externalSubscriptionId?: string | null;
    cancelAtPeriodEnd?: boolean;
    currentPeriodStartsAt?: Date | null;
    currentPeriodEndsAt?: Date | null;
    cancelAt?: Date | null;
    cancelledAt?: Date | null;
    endedAt?: Date | null;
  }) {
    const subscription = await prisma.$transaction(async (tx) => {
      const updated = await subscriptionRepository.updateLifecycle(
        input.subscriptionId,
        {
          status: input.status,
          ...(input.externalStatus !== undefined ? { externalStatus: input.externalStatus } : {}),
          ...(input.externalSubscriptionId !== undefined
            ? { externalSubscriptionId: input.externalSubscriptionId }
            : {}),
          ...(input.cancelAtPeriodEnd !== undefined
            ? { cancelAtPeriodEnd: input.cancelAtPeriodEnd }
            : {}),
          ...(input.currentPeriodStartsAt !== undefined
            ? { currentPeriodStartsAt: input.currentPeriodStartsAt }
            : {}),
          ...(input.currentPeriodEndsAt !== undefined
            ? { currentPeriodEndsAt: input.currentPeriodEndsAt }
            : {}),
          ...(input.cancelAt !== undefined ? { cancelAt: input.cancelAt } : {}),
          ...(input.cancelledAt !== undefined ? { cancelledAt: input.cancelledAt } : {}),
          ...(input.endedAt !== undefined ? { endedAt: input.endedAt } : {}),
        },
        tx,
      );

      await auditLogService.create(
        {
          ...(input.scope.organizationId
            ? { organizationId: input.scope.organizationId }
            : {}),
          ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
          action: "billing.subscription.lifecycle-synced",
          entityType: "Subscription",
          entityId: updated.id,
          metadata: {
            status: input.status,
            externalStatus: input.externalStatus ?? null,
          },
        },
        tx,
      );

      return updated;
    });

    return {
      success: true as const,
      data: subscription,
    };
  }
}

export const subscriptionService = new SubscriptionService();
