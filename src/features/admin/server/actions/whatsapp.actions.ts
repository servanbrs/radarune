"use server";

import { revalidatePath } from "next/cache";
import { authSessionService } from "@/features/authentication/server/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { integrationCredentialService } from "@/features/integrations/server/services/integration-credential.service";

export async function saveWhatsappAction(formData: FormData) {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  await integrationCredentialService.upsertWhatsapp(actor, {
    phoneNumberId: String(formData.get("phoneNumberId") ?? ""),
    businessAccountId: String(formData.get("businessAccountId") ?? ""),
    accessToken: String(formData.get("accessToken") ?? ""),
    recipients: String(formData.get("recipients") ?? ""),
    templateName: String(formData.get("templateName") ?? ""),
    templateLanguage: String(formData.get("templateLanguage") ?? "tr"),
  });
  revalidatePath("/admin/integrations/whatsapp");
}
