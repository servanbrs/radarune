import "server-only";
import { prisma } from "@/server/prisma/prisma";

export class UserAuthRepository {
  async findDashboardUserById(userId: string) {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        emailVerified: true,
        systemRole: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

export const userAuthRepository = new UserAuthRepository();
