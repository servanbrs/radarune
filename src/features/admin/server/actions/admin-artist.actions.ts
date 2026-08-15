"use server";

import { revalidatePath } from "next/cache";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { canAccessAdmin } from "@/features/admin/server/admin-context";
import { createArtistSchema } from "@/features/artist/schemas/artist.schema";
import { artistService } from "@/features/artist/server/services/artist.service";
import { prisma } from "@/server/prisma/prisma";

export async function createAdminArtistAction(formData: FormData) {
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = { organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id };
  if (!canAccessAdmin(actor)) return { success: false as const, message: "Bu işlem yalnızca admin kullanıcılarına açıktır." };

  const parsed = createArtistSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    sortName: String(formData.get("sortName") ?? "") || undefined,
    type: String(formData.get("type") ?? "SOLO"),
    spotifyProfileUrl: String(formData.get("spotifyProfileUrl") ?? "") || undefined,
    appleMusicProfileUrl: String(formData.get("appleMusicProfileUrl") ?? "") || undefined,
  });
  if (!parsed.success) return { success: false as const, message: "Sanatçı bilgilerini kontrol edin." };

  const ownerUserId = String(formData.get("ownerUserId") ?? "").trim() || undefined;
  if (ownerUserId) {
    const owner = await prisma.user.findFirst({ where: { id: ownerUserId, accountStatus: "ACTIVE" }, select: { id: true } });
    if (!owner) return { success: false as const, message: "Seçilen kullanıcı bulunamadı." };
  }

  const result = await artistService.createForOrganization({ createdByUserId: user.id, ...(ownerUserId ? { ownerUserId } : {}), input: parsed.data, organizationId: organization.organization.id });
  if (!result.success) return result;
  revalidatePath("/admin/artists");
  revalidatePath("/artists");
  return result;
}
