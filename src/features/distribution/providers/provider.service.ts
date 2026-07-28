import { defaultDistributionProviderProfiles } from "./provider.constants";
import { resolveProviderRequirements } from "./provider-requirement.service";
import type {
  DistributionProviderId,
  DistributionProviderProfile,
} from "./provider.types";

export function getDefaultProviderProfiles(): DistributionProviderProfile[] {
  return structuredClone(defaultDistributionProviderProfiles);
}

export function getActiveProviderProfiles(
  profiles: DistributionProviderProfile[],
): DistributionProviderProfile[] {
  return profiles
    .filter((profile) => profile.enabled)
    .sort((a, b) => a.priority - b.priority);
}

export function resolveActiveProviderRequirements(
  profiles: DistributionProviderProfile[],
) {
  const activeProviders = getActiveProviderProfiles(profiles).map(
    (profile) => profile.id,
  );

  return resolveProviderRequirements(profiles, activeProviders);
}

export function enableProviders(
  providerIds: DistributionProviderId[],
): DistributionProviderProfile[] {
  const profiles = getDefaultProviderProfiles();

  return profiles.map((profile) => ({
    ...profile,
    enabled: providerIds.includes(profile.id),
  }));
}
