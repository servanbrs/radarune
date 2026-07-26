import "server-only";
import { auditLogService } from "@/features/finance/server/services/audit-log.service";
import { updateUsernameSchema } from "@/features/users/schemas/username.schema";
import { userProfileRepository } from "@/features/users/server/repositories/user-profile.repository";
import { prisma } from "@/server/prisma/prisma";

const usernameChangeCooldownDays = 30;

export class UserProfileService {
  async getPublicProfile(username: string) {
    const profile = await userProfileRepository.findByUsername(username);
    if (profile) return { profile, redirectTo: null };
    const history = await userProfileRepository.findHistory(username);
    return { profile: null, redirectTo: history?.newUsername ?? null };
  }

  async updateUsername(userId: string, organizationId: string | undefined, input: unknown) {
    const parsed = updateUsernameSchema.parse(input);
    return prisma.$transaction(async (client) => {
      const current = await userProfileRepository.findForUpdate(userId, client);
      if (!current) throw new Error("Kullanıcı bulunamadı.");
      if (current.username === parsed.username) return { username: parsed.username, changed: false as const };
      if (current.usernameChangeAvailableAt && current.usernameChangeAvailableAt > new Date()) {
        throw new Error("Kullanıcı adı değiştirme süresi henüz dolmadı.");
      }
      const existing = await client.user.findUnique({ where: { username: parsed.username }, select: { id: true } });
      if (existing && existing.id !== userId) throw new Error("Bu kullanıcı adı zaten kullanılıyor.");
      if (current.username) {
        await client.userUsernameHistory.create({ data: { userId, oldUsername: current.username, newUsername: parsed.username } });
      }
      const changedAt = new Date();
      const availableAt = new Date(changedAt.getTime() + usernameChangeCooldownDays * 24 * 60 * 60 * 1_000);
      const updated = await client.user.update({ where: { id: userId }, data: { username: parsed.username, usernameUpdatedAt: changedAt, usernameChangeAvailableAt: availableAt }, select: { id: true, username: true, usernameChangeAvailableAt: true } });
      await auditLogService.create({ ...(organizationId ? { organizationId } : {}), actorUserId: userId, action: "USERNAME_CHANGED", entityType: "User", entityId: userId, metadata: { previousUsername: current.username, newUsername: parsed.username } }, client);
      return { ...updated, changed: true as const };
    });
  }
}

export const userProfileService = new UserProfileService();
