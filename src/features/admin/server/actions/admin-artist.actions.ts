"use server";

import { revalidatePath } from "next/cache";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { canAccessAdmin } from "@/features/admin/server/admin-context";
import { notificationService } from "@/features/admin/server/services/notification.service";
import { createArtistSchema } from "@/features/artist/schemas/artist.schema";
import { artistService } from "@/features/artist/server/services/artist.service";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
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

export async function transferArtistOwnershipAction(formData: FormData) {
  const { organization, user } = await authSessionService.getDashboardContext();
  const organizationId = organization.organization.id;
  const actor = { organizationId, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id };
  if (!canAccessAdmin(actor)) return { success: false as const, message: "Bu işlem yalnızca admin kullanıcılarına açıktır." };

  const artistId = String(formData.get("artistId") ?? "").trim();
  const ownerUserId = String(formData.get("ownerUserId") ?? "").trim() || null;
  if (!artistId) return { success: false as const, message: "Sanatçı seçilmedi." };

  const artist = await prisma.artist.findFirst({ where: { id: artistId, organizationId }, select: { id: true, name: true, ownerUserId: true } });
  if (!artist) return { success: false as const, message: "Sanatçı kanalı bulunamadı." };

  if (ownerUserId) {
    const owner = await prisma.user.findFirst({
      where: {
        id: ownerUserId,
        accountStatus: "ACTIVE",
        memberships: { some: { organizationId, status: "ACTIVE" } },
      },
      select: { id: true },
    });
    if (!owner) return { success: false as const, message: "Seçilen kullanıcı bu organizasyonda aktif değil." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.artist.update({ where: { id: artist.id }, data: { ownerUserId } });
    if (artist.ownerUserId && artist.ownerUserId !== ownerUserId) {
      await tx.artistTeamMember.deleteMany({ where: { artistId: artist.id, userId: artist.ownerUserId, role: "OWNER" } });
    }
    if (ownerUserId) {
      await tx.artistTeamMember.upsert({
        where: { artistId_userId: { artistId: artist.id, userId: ownerUserId } },
        update: { role: "OWNER" },
        create: { organizationId, artistId: artist.id, userId: ownerUserId, role: "OWNER" },
      });
      await notificationService.create({
        userId: ownerUserId,
        type: "ARTIST_CHANNEL_ASSIGNED",
        title: "Sanatçı kanalı hesabına atandı",
        message: `${artist.name} kanalı artık sanatçı kanallarında görünüyor.`,
        entityType: "Artist",
        entityId: artist.id,
      }, tx);
    }
    await auditLogService.create({
      organizationId,
      actorUserId: user.id,
      action: "ARTIST_CHANNEL_OWNERSHIP_TRANSFERRED",
      entityType: "Artist",
      entityId: artist.id,
      metadata: { previousOwnerUserId: artist.ownerUserId, ownerUserId },
    }, tx);
  });

  revalidatePath("/admin/artists");
  revalidatePath(`/admin/artists/${artist.id}`);
  revalidatePath("/artist-profile");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/artists/${artist.id}/profile`);
  return { success: true as const, message: ownerUserId ? "Sanatçı kanalı kullanıcıya devredildi." : "Sanatçı kanalı ataması kaldırıldı." };
}
