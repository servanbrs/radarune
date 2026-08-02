import "server-only";
import { artistRepository } from "@/features/artist/server/repositories/artist.repository";
import type { BillingFeatureKey } from "@/features/billing/constants/feature-keys";
import type { BillingScopeInput } from "@/features/billing/schemas/billing.schema";
import { planRepository } from "@/features/billing/server/repositories/plan.repository";
import { paymentProviderConfigRepository } from "@/features/billing/server/repositories/payment-provider-config.repository";
import { subscriptionRepository } from "@/features/billing/server/repositories/subscription.repository";
import { organizationRepository } from "@/features/organization/server/repositories/organization.repository";
import { prisma } from "@/server/prisma/prisma";

type FeatureValue = boolean | number | string | Record<string, unknown>;

async function prismaSmartLinkCount(organizationId: string) {
  return prisma.smartLink.count({ where: { organizationId } });
}

async function prismaPreSaveCampaignCount(organizationId: string) {
  return prisma.preSaveCampaign.count({ where: { organizationId } });
}

async function prismaPlaylistCount(userId: string) {
  return prisma.playlist.count({ where: { ownerUserId: userId } });
}

function normalizeFeatureValue(feature: {
  valueType: "BOOLEAN" | "INTEGER" | "STRING" | "JSON";
  booleanValue: boolean | null;
  integerValue: number | null;
  stringValue: string | null;
  jsonValue: unknown;
}): FeatureValue | null {
  switch (feature.valueType) {
    case "BOOLEAN":
      return feature.booleanValue;
    case "INTEGER":
      return feature.integerValue;
    case "STRING":
      return feature.stringValue;
    case "JSON":
      if (feature.jsonValue && typeof feature.jsonValue === "object") {
        return feature.jsonValue as Record<string, unknown>;
      }
      return null;
    default:
      return null;
  }
}

export class EntitlementService {
  async getCurrentSubscription(scope: BillingScopeInput) {
    const activeSubscription = await subscriptionRepository.findActiveByScope(scope);

    if (activeSubscription) {
      return activeSubscription;
    }

    return null;
  }

  async getCurrentPlan(scope: BillingScopeInput) {
    const subscription = await this.getCurrentSubscription(scope);

    if (subscription) {
      return subscription.plan;
    }

    return planRepository.findPlanByCode("FREE");
  }

  async getFeatureMap(scope: BillingScopeInput) {
    const plan = await this.getCurrentPlan(scope);

    if (!plan) {
      return new Map<BillingFeatureKey, FeatureValue>();
    }

    const featureMap = new Map<BillingFeatureKey, FeatureValue>();

    for (const feature of plan.features) {
      const normalized = normalizeFeatureValue(feature);

      if (normalized !== null) {
        featureMap.set(feature.featureKey as BillingFeatureKey, normalized);
      }
    }

    return featureMap;
  }

  async getUsage(scope: BillingScopeInput, featureKey: BillingFeatureKey) {
    switch (featureKey) {
      case "artists.max":
        if (!scope.organizationId) {
          return 0;
        }
        return artistRepository.countByOrganizationId(scope.organizationId);
      case "team_members.max":
        if (!scope.organizationId) {
          return 1;
        }
        return organizationRepository.countMembershipsByOrganizationId(scope.organizationId);
      case "distribution.providers.max":
        if (!scope.organizationId) {
          return 0;
        }
        return (
          await paymentProviderConfigRepository.listByOrganizationId(scope.organizationId)
        ).filter((config) => config.active).length;
      case "smart_links.max":
        if (!scope.organizationId) {
          return 0;
        }
        return prismaSmartLinkCount(scope.organizationId);
      case "presave.max":
        if (!scope.organizationId) {
          return 0;
        }
        return prismaPreSaveCampaignCount(scope.organizationId);
      case "playlists.max":
        if (!scope.userId) {
          return 0;
        }
        return prismaPlaylistCount(scope.userId);
      case "ai.metadata.monthly_limit":
        if (!scope.organizationId) {
          return 0;
        }
        return prisma.aiUsageRecord.count({
          where: {
            organizationId: scope.organizationId,
            usageType: "METADATA_ANALYSIS",
            usageDate: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        });
      default:
        throw new Error(`Feature usage resolver tanımlı değil: ${featureKey}`);
    }
  }

  async assertFeatureEnabled(scope: BillingScopeInput, featureKey: BillingFeatureKey) {
    const featureMap = await this.getFeatureMap(scope);
    const value = featureMap.get(featureKey);

    if (value !== true) {
      throw new Error(`${featureKey} özelliği mevcut plan için aktif değil.`);
    }
  }

  async assertWithinLimit(scope: BillingScopeInput, featureKey: BillingFeatureKey, increment = 1) {
    const featureMap = await this.getFeatureMap(scope);
    const value = featureMap.get(featureKey);

    if (typeof value !== "number") {
      throw new Error(`${featureKey} için sayısal limit tanımlı değil.`);
    }

    const usage = await this.getUsage(scope, featureKey);

    if (usage + increment > value) {
      throw new Error(`${featureKey} limiti aşıldı.`);
    }

    return {
      limit: value,
      usage,
      remaining: value - usage,
    };
  }

  /** Smart Link is a free core growth feature; configured plans may still tighten its quota. */
  async assertSmartLinkCreationAvailable(scope: BillingScopeInput) {
    const featureMap = await this.getFeatureMap(scope);
    const enabled = featureMap.get("smart_links.enabled");
    if (enabled === false) throw new Error("smart_links.enabled özelliği mevcut plan için aktif değil.");
    const configuredLimit = featureMap.get("smart_links.max");
    if (typeof configuredLimit === "number") {
      const usage = await this.getUsage(scope, "smart_links.max");
      if (usage + 1 > configuredLimit) throw new Error("smart_links.max limiti aşıldı.");
      return { limit: configuredLimit, usage, remaining: configuredLimit - usage };
    }
    const usage = await this.getUsage(scope, "smart_links.max");
    const freeLimit = 10;
    if (usage + 1 > freeLimit) throw new Error("Ücretsiz Smart Link limiti (10) aşıldı.");
    return { limit: freeLimit, usage, remaining: freeLimit - usage };
  }
}

export const entitlementService = new EntitlementService();
