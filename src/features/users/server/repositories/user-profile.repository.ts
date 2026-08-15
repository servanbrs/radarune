import "server-only";
import type { DatabaseClient } from "@/server/prisma/database-client";
import { prisma } from "@/server/prisma/prisma";

export class UserProfileRepository {
  async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { playlists: { where: { public: true } }, follows: true, playlistLikes: true } },
        playlists: {
          where: { public: true },
          orderBy: { updatedAt: "desc" },
          take: 12,
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            coverImageUrl: true,
            updatedAt: true,
            _count: { select: { tracks: true, likes: true } },
          },
        },
      },
    });
  }

  async findHistory(username: string) {
    return prisma.userUsernameHistory.findUnique({ where: { oldUsername: username }, select: { newUsername: true } });
  }

  async findForUpdate(userId: string, client: DatabaseClient = prisma) {
    return client.user.findUnique({ where: { id: userId }, select: { id: true, username: true, usernameChangeAvailableAt: true } });
  }
}

export const userProfileRepository = new UserProfileRepository();
