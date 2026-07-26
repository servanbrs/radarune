import "server-only";
import { prisma } from "@/server/prisma/prisma";
import type { MobilePlatform } from "@/generated/prisma/client";

function parseSemver(version: string) {
  const [major = "0", minor = "0", patch = "0"] = version.split(".");
  return {
    major: Number.parseInt(major, 10) || 0,
    minor: Number.parseInt(minor, 10) || 0,
    patch: Number.parseInt(patch, 10) || 0,
  };
}

export function compareSemver(left: string, right: string) {
  const a = parseSemver(left);
  const b = parseSemver(right);
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

export class MobileAppConfigService {
  async getConfig(input: { platform: MobilePlatform; appVersion: string }) {
    const version = await prisma.mobileAppVersion.findFirst({
      where: { platform: input.platform, active: true },
      orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }],
    });

    const minimumSupportedVersion = version?.minimumSupportedVersion ?? "1.0.0";
    const latestVersion = version?.latestVersion ?? minimumSupportedVersion;
    const forceUpdate = version?.forceUpdate || compareSemver(input.appVersion, minimumSupportedVersion) < 0;

    return {
      minimumSupportedVersion,
      latestVersion,
      forceUpdate,
      maintenanceMode: version?.maintenanceMode ?? false,
      maintenanceMessage: version?.maintenanceMessage ?? null,
      featureFlags: version?.featureFlags ?? {
        "mobile.releases.enabled": true,
        "mobile.uploads.enabled": true,
        "mobile.discover.enabled": true,
        "mobile.player.enabled": true,
        "mobile.payouts.enabled": true,
        "mobile.presave.enabled": true,
        "mobile.intelligence.enabled": true,
        "mobile.social.enabled": true,
      },
      legalDocumentVersions: version?.legalDocumentVersions ?? {
        terms: "1.0.0",
        privacy: "1.0.0",
      },
    };
  }
}

export const mobileAppConfigService = new MobileAppConfigService();
