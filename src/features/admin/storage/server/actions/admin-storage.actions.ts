"use server";

import { revalidatePath } from "next/cache";

import { toAdminActor } from "@/features/admin/server/admin-context";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { adminStorageService } from "@/features/admin/storage/server/services/admin-storage.service";

async function getActor() {
  const { organization, user } =
    await authSessionService.getDashboardContext();

  return toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
}

function getText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function getOptionalNumber(
  formData: FormData,
  name: string,
) {
  const rawValue = getText(formData, name);

  if (!rawValue) {
    return undefined;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value)) {
    throw new Error(
      `${name} alanı geçerli bir sayı olmalıdır.`,
    );
  }

  return value;
}

export async function createLocalStorageProviderAction(
  formData: FormData,
) {
  const actor = await getActor();

  const maxFileSizeMb = getOptionalNumber(
    formData,
    "maxFileSizeMb",
  );

  await adminStorageService.createLocalProvider(actor, {
    name: getText(formData, "name"),
    localBasePath: getText(formData, "localBasePath"),
    publicBaseUrl: getText(formData, "publicBaseUrl"),
    ...(maxFileSizeMb !== undefined
      ? { maxFileSizeMb }
      : {}),
  });

  revalidatePath("/admin/storage");
}

export async function testStorageProviderAction(
  formData: FormData,
) {
  const actor = await getActor();
  const providerId = getText(formData, "providerId");

  await adminStorageService.testProvider(
    actor,
    providerId,
  );

  revalidatePath("/admin/storage");
}

export async function toggleStorageProviderAction(
  formData: FormData,
) {
  const actor = await getActor();
  const providerId = getText(formData, "providerId");

  await adminStorageService.toggleProvider(
    actor,
    providerId,
  );

  revalidatePath("/admin/storage");
}

export async function setDefaultStorageProviderAction(
  formData: FormData,
) {
  const actor = await getActor();
  const providerId = getText(formData, "providerId");

  await adminStorageService.setDefaultProvider(
    actor,
    providerId,
  );

  revalidatePath("/admin/storage");
}
