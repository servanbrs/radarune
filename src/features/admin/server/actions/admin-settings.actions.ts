"use server";

import { revalidatePath } from "next/cache";

import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { adminSystemService } from "@/features/admin/server/services/admin-system.service";
import type { UpdateAdminSettingInput } from "@/features/admin/schemas/admin.schema";

function getText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function getNumber(formData: FormData, name: string) {
  const value = Number(formData.get(name));

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} alanı geçerli bir sayı olmalıdır.`);
  }

  return value;
}

function getBoolean(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

export async function updateAdminSettingsAction(
  formData: FormData,
) {
  const { organization, user } =
    await authSessionService.getDashboardContext();

  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  const reason = getText(formData, "reason");

  if (reason.length < 10) {
    throw new Error(
      "Değişiklik sebebi en az 10 karakter olmalıdır.",
    );
  }

  const audioSizeMb = getNumber(
    formData,
    "maxAudioFileSizeMb",
  );

  const artworkSizeMb = getNumber(
    formData,
    "maxArtworkFileSizeMb",
  );

  const settings: UpdateAdminSettingInput[] = [
    {
      key: "PLATFORM_NAME",
      value: getText(formData, "platformName"),
      reason,
    },
    {
      key: "LOGO_URL",
      value: getText(formData, "logoUrl"),
      reason,
    },
    {
      key: "SUPPORT_EMAIL",
      value: getText(formData, "supportEmail"),
      reason,
    },
    {
      key: "DEFAULT_DISTRIBUTION_PROVIDER",
      value: getText(
        formData,
        "defaultDistributionProvider",
      ),
      reason,
    },
    {
      key: "AUTO_DISTRIBUTION_ENABLED",
      value: getBoolean(
        formData,
        "autoDistributionEnabled",
      ),
      reason,
    },
    {
      key: "MAX_AUDIO_FILE_SIZE_BYTES",
      value: Math.round(audioSizeMb * 1024 * 1024),
      reason,
    },
    {
      key: "MAX_ARTWORK_FILE_SIZE_BYTES",
      value: Math.round(artworkSizeMb * 1024 * 1024),
      reason,
    },
    {
      key: "MIN_ARTWORK_RESOLUTION",
      value: Math.round(
        getNumber(formData, "minArtworkResolution"),
      ),
      reason,
    },
    {
      key: "USER_REGISTRATION_ENABLED",
      value: getBoolean(
        formData,
        "userRegistrationEnabled",
      ),
      reason,
    },
    {
      key: "ARTIST_APPLICATIONS_ENABLED",
      value: getBoolean(
        formData,
        "artistApplicationsEnabled",
      ),
      reason,
    },
    {
      key: "EMAIL_VERIFICATION_REQUIRED",
      value: getBoolean(
        formData,
        "emailVerificationRequired",
      ),
      reason,
    },
    {
      key: "MAINTENANCE_MODE_ENABLED",
      value: getBoolean(
        formData,
        "maintenanceModeEnabled",
      ),
      reason,
    },
    {
      key: "MAINTENANCE_MESSAGE",
      value: getText(formData, "maintenanceMessage"),
      reason,
    },
  ];

  for (const setting of settings) {
    await adminSystemService.updateSetting(actor, setting);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
}