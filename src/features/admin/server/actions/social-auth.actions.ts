"use server";

import { revalidatePath } from "next/cache";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { integrationCredentialService } from "@/features/integrations/server/services/integration-credential.service";

export async function saveSocialAuthProviderAction(formData: FormData) {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const provider = String(formData.get("provider")) as "GOOGLE_OAUTH" | "FACEBOOK_OAUTH";
  if (provider !== "GOOGLE_OAUTH" && provider !== "FACEBOOK_OAUTH") throw new Error("Geçersiz sosyal giriş sağlayıcısı.");
  await integrationCredentialService.upsertSocial(actor, provider, { clientId: String(formData.get("clientId") ?? ""), clientSecret: String(formData.get("clientSecret") ?? "") });
  revalidatePath("/admin/social");
  revalidatePath("/sign-in");
  revalidatePath("/sign-up");
}
