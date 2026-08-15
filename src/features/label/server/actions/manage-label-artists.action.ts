"use server";

import { revalidatePath } from "next/cache";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import { labelRepository } from "@/features/label/server/repositories/label.repository";

async function context() {
  const { organization } = await authSessionService.getDashboardContext();
  rbacService.assertPermission(organization.role, "label:update");
  return organization.organization.id;
}

export async function linkLabelArtistAction(formData: FormData) {
  const organizationId = await context();
  await labelRepository.linkArtist({ organizationId, labelId: String(formData.get("labelId")), artistId: String(formData.get("artistId")) });
  revalidatePath("/labels");
  revalidatePath("/releases/new");
}

export async function unlinkLabelArtistAction(formData: FormData) {
  const organizationId = await context();
  await labelRepository.unlinkArtist({ organizationId, labelId: String(formData.get("labelId")), artistId: String(formData.get("artistId")) });
  revalidatePath("/labels");
  revalidatePath("/releases/new");
}
