"use server";

import { revalidatePath } from "next/cache";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { rbacService } from "@/features/authorization/server/rbac";
import type { CreateArtistInput } from "@/features/artist/schemas/artist.schema";
import { artistService } from "@/features/artist/server/services/artist.service";
import type { ActionResult } from "@/lib/server-action-result";

export async function createArtistAction(
  input: CreateArtistInput,
): Promise<ActionResult<{ id: string; name: string; slug: string }>> {
  const { organization, session } = await authSessionService.getDashboardContext();

  try {
    rbacService.assertPermission(organization.role, "artist:create");
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unauthorized action.",
    };
  }

  const result = await artistService.createForOrganization({
    createdByUserId: session.user.id,
    input,
    organizationId: organization.organization.id,
  });

  if (!result.success) {
    return result;
  }

  revalidatePath("/artists");
  revalidatePath("/dashboard");

  return result;
}
