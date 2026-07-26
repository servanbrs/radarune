import "server-only";
import { planRepository } from "@/features/billing/server/repositories/plan.repository";
import {
  createSubscriptionPlanSchema,
  upsertPlanFeatureSchema,
  upsertPlanPriceSchema,
  type CreateSubscriptionPlanInput,
  type UpsertPlanFeatureInput,
  type UpsertPlanPriceInput,
} from "@/features/billing/schemas/billing.schema";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

function getFirstValidationError(error: ReturnType<typeof createSubscriptionPlanSchema.safeParse>) {
  if (error.success) {
    return null;
  }

  return Object.values(error.error.flatten().fieldErrors).flat().find(Boolean) ?? "Geçersiz veri.";
}

export class PlanCatalogService {
  async listPublicPlans() {
    return planRepository.listPublicPlans();
  }

  async listAllPlans() {
    return planRepository.listAllPlans();
  }

  async upsertPlan(actor: FinanceActorContext, input: CreateSubscriptionPlanInput) {
    const parsed = createSubscriptionPlanSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false as const,
        message: getFirstValidationError(parsed) ?? "Plan bilgileri doğrulanamadı.",
      };
    }

    const plan = await planRepository.upsertPlan(parsed.data);

    await auditLogService.create({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "billing.plan.upserted",
      entityType: "SubscriptionPlan",
      entityId: plan.id,
      metadata: {
        code: plan.code,
      },
    });

    return {
      success: true as const,
      data: plan,
    };
  }

  async upsertPlanPrice(actor: FinanceActorContext, input: UpsertPlanPriceInput) {
    const parsed = upsertPlanPriceSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false as const,
        message:
          Object.values(parsed.error.flatten().fieldErrors).flat().find(Boolean) ??
          "Plan fiyatı doğrulanamadı.",
      };
    }

    const price = await planRepository.upsertPlanPrice(parsed.data);

    await auditLogService.create({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "billing.plan-price.upserted",
      entityType: "PlanPrice",
      entityId: price.id,
      metadata: {
        planId: parsed.data.planId,
        provider: parsed.data.provider,
      },
    });

    return {
      success: true as const,
      data: price,
    };
  }

  async upsertPlanFeature(actor: FinanceActorContext, input: UpsertPlanFeatureInput) {
    const parsed = upsertPlanFeatureSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false as const,
        message:
          Object.values(parsed.error.flatten().fieldErrors).flat().find(Boolean) ??
          "Plan özelliği doğrulanamadı.",
      };
    }

    const feature = await planRepository.upsertPlanFeature(parsed.data);

    await auditLogService.create({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "billing.plan-feature.upserted",
      entityType: "PlanFeature",
      entityId: feature.id,
      metadata: {
        planId: parsed.data.planId,
        featureKey: parsed.data.featureKey,
      },
    });

    return {
      success: true as const,
      data: feature,
    };
  }
}

export const planCatalogService = new PlanCatalogService();
