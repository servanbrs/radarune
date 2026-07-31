import "server-only";
import { growthRepository } from "@/features/growth/server/repositories/growth.repository";
import { hashPrivacyValue } from "@/features/growth/server/security.server";

export class SmartLinkAnalyticsService {
  async recordView(input: {
    organizationId: string;
    smartLinkId: string;
    ip: string;
    userAgent?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }) {
    const ipHash = hashPrivacyValue(input.ip);
    const visitorHash = hashPrivacyValue(`${input.ip}:${input.userAgent ?? ""}`);
    return growthRepository.recordSmartLinkView({
      organizationId: input.organizationId,
      smartLinkId: input.smartLinkId,
      visitorHash,
      ipHash,
      ...(input.userAgent ? { userAgent: input.userAgent } : {}),
      ...(input.referrer ? { referrer: input.referrer } : {}),
      ...(input.utmSource ? { utmSource: input.utmSource } : {}),
      ...(input.utmMedium ? { utmMedium: input.utmMedium } : {}),
      ...(input.utmCampaign ? { utmCampaign: input.utmCampaign } : {}),
    });
  }
}

export const smartLinkAnalyticsService = new SmartLinkAnalyticsService();
