"use server";

import { revalidatePath } from "next/cache";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import type { CreateLabelInput } from "@/features/label/schemas/label.schema";
import { labelService } from "@/features/label/server/services/label.service";
import type { ActionResult } from "@/lib/server-action-result";

export async function createLabelAction(
  input: CreateLabelInput,
): Promise<ActionResult<{ id: string; name: string; slug: string }>> {
  const { organization, session } = await authSessionService.getDashboardContext();

  try {
    rbacService.assertPermission(organization.role, "label:create");
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unauthorized action.",
    };
  }

  const result = await labelService.createForOrganization({
    createdByUserId: session.user.id,
    input,
    organizationId: organization.organization.id,
  });

  if (!result.success) {
    return result;
  }

  revalidatePath("/labels");
  revalidatePath("/dashboard");

  return result;
}
