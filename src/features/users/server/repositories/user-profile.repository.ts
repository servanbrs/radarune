import "server-only";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

export class UserProfileRepository {
  async findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username }, select: { id: true, username: true, name: true, image: true, createdAt: true } });
  }

  async findHistory(username: string) {
    return prisma.userUsernameHistory.findUnique({ where: { oldUsername: username }, select: { newUsername: true } });
  }

  async findForUpdate(userId: string, client: DatabaseClient = prisma) {
    return client.user.findUnique({ where: { id: userId }, select: { id: true, username: true, usernameChangeAvailableAt: true } });
  }
}

export const userProfileRepository = new UserProfileRepository();
