"use server";

import { revalidatePath } from "next/cache";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { organizationService } from "@/features/organization/server/services/organization.service";
import type { CreateOrganizationInput } from "@/features/organization/schemas/organization.schema";
import type { ActionResult } from "@/lib/server-action-result";

export async function createOrganizationAction(
  input: CreateOrganizationInput,
): Promise<ActionResult<{ organizationId: string }>> {
  const session = await authSessionService.getRequiredSession();

  const organization = await organizationService.createOrganizationForOwner(
    session.user.id,
    input,
  );

  if (!organization.success) {
    return organization;
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/onboarding/organization");

  return {
    success: true,
    data: {
      organizationId: organization.data.id,
    },
  };
}
