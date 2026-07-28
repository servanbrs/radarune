import type {
  DistributionProviderId,
  DistributionProviderProfile,
  ResolvedProviderRequirements,
} from "./provider.types";

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function everyTrue(values: boolean[]): boolean {
  return values.every(Boolean);
}

function someTrue(values: boolean[]): boolean {
  return values.some(Boolean);
}

export function resolveProviderRequirements(
  profiles: DistributionProviderProfile[],
  selectedProviders: DistributionProviderId[],
): ResolvedProviderRequirements {
  const selectedProfiles = profiles
    .filter(
      (profile) =>
        profile.enabled && selectedProviders.includes(profile.id),
    )
    .sort((a, b) => a.priority - b.priority);

  if (selectedProfiles.length === 0) {
    throw new Error("En az bir aktif dağıtım sağlayıcısı seçilmelidir.");
  }

  const requirements = selectedProfiles.map(
    (profile) => profile.requirements,
  );

  const requiredReleaseFields = unique(
    requirements.flatMap((item) => item.releaseFields.required),
  );

  const requiredTrackFields = unique(
    requirements.flatMap((item) => item.trackFields.required),
  );

  return {
    providers: selectedProfiles.map((profile) => profile.id),

    releaseFields: {
      required: requiredReleaseFields,
      optional: unique(
        requirements
          .flatMap((item) => item.releaseFields.optional)
          .filter((field) => !requiredReleaseFields.includes(field)),
      ),
    },

    trackFields: {
      required: requiredTrackFields,
      optional: unique(
        requirements
          .flatMap((item) => item.trackFields.optional)
          .filter((field) => !requiredTrackFields.includes(field)),
      ),
    },

    contributors: {
      requireLegalName: someTrue(
        requirements.map(
          (item) => item.contributors.requireLegalName,
        ),
      ),
      requireFirstAndLastName: someTrue(
        requirements.map(
          (item) => item.contributors.requireFirstAndLastName,
        ),
      ),
      requireSharePercentage: someTrue(
        requirements.map(
          (item) => item.contributors.requireSharePercentage,
        ),
      ),
      requireShareTotal100: someTrue(
        requirements.map(
          (item) => item.contributors.requireShareTotal100,
        ),
      ),
      requiredCategories: unique(
        requirements.flatMap(
          (item) => item.contributors.requiredCategories,
        ),
      ),
      allowedRoles: unique(
        requirements.flatMap(
          (item) => item.contributors.allowedRoles,
        ),
      ),
    },

    artwork: {
      required: someTrue(
        requirements.map((item) => item.artwork.required),
      ),
      minimumWidth: Math.max(
        ...requirements.map((item) => item.artwork.minimumWidth),
      ),
      minimumHeight: Math.max(
        ...requirements.map((item) => item.artwork.minimumHeight),
      ),
      square: someTrue(
        requirements.map((item) => item.artwork.square),
      ),
      allowedFormats: unique(
        requirements.flatMap(
          (item) => item.artwork.allowedFormats,
        ),
      ),
      maximumFileSizeMb: Math.min(
        ...requirements.map(
          (item) => item.artwork.maximumFileSizeMb,
        ),
      ),
      requireRgb: someTrue(
        requirements.map((item) => item.artwork.requireRgb),
      ),
    },

    audio: {
      required: someTrue(
        requirements.map((item) => item.audio.required),
      ),
      allowedFormats: unique(
        requirements.flatMap((item) => item.audio.allowedFormats),
      ),
      minimumSampleRateHz: Math.max(
        ...requirements.map(
          (item) => item.audio.minimumSampleRateHz,
        ),
      ),
      minimumBitDepth: Math.max(
        ...requirements.map(
          (item) => item.audio.minimumBitDepth,
        ),
      ),
      allowMono: everyTrue(
        requirements.map((item) => item.audio.allowMono),
      ),
      allowStereo: everyTrue(
        requirements.map((item) => item.audio.allowStereo),
      ),
      allowFloatingPointWav: everyTrue(
        requirements.map(
          (item) => item.audio.allowFloatingPointWav,
        ),
      ),
    },

    codes: {
      canAssignUpc: everyTrue(
        requirements.map((item) => item.codes.canAssignUpc),
      ),
      canAssignIsrc: everyTrue(
        requirements.map((item) => item.codes.canAssignIsrc),
      ),
      requireExistingUpcWhenPreviouslyReleased: someTrue(
        requirements.map(
          (item) =>
            item.codes.requireExistingUpcWhenPreviouslyReleased,
        ),
      ),
      requireExistingIsrcWhenPreviouslyReleased: someTrue(
        requirements.map(
          (item) =>
            item.codes.requireExistingIsrcWhenPreviouslyReleased,
        ),
      ),
    },

    rights: {
      requireMasterRightsDeclaration: someTrue(
        requirements.map(
          (item) =>
            item.rights.requireMasterRightsDeclaration,
        ),
      ),
      requireCompositionRightsDeclaration: someTrue(
        requirements.map(
          (item) =>
            item.rights.requireCompositionRightsDeclaration,
        ),
      ),
      requireSampleDeclaration: someTrue(
        requirements.map(
          (item) => item.rights.requireSampleDeclaration,
        ),
      ),
      requireCoverDeclaration: someTrue(
        requirements.map(
          (item) => item.rights.requireCoverDeclaration,
        ),
      ),
      requireRemixDeclaration: someTrue(
        requirements.map(
          (item) => item.rights.requireRemixDeclaration,
        ),
      ),
      requireAiContentDeclaration: someTrue(
        requirements.map(
          (item) => item.rights.requireAiContentDeclaration,
        ),
      ),
    },
  };
}
