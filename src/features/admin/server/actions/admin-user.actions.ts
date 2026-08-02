"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { adminUserService } from "@/features/admin/server/services/admin-user.service";

export async function createAdminUserAction(formData: FormData) {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  await adminUserService.createUser(actor, {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? "USER") as "USER" | "ARTIST" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN",
  });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}
