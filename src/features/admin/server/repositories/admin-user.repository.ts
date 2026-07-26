import "server-only";
import { Prisma, type UserAccountStatus, type UserSystemRole } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import type { DatabaseClient } from "@/server/prisma/database-client";

export class AdminUserRepository {
  async list(params: { page: number; pageSize: number; search?: string }) {
    const where: Prisma.UserWhereInput = params.search
      ? {
          OR: [
            { name: { contains: params.search } },
            { email: { contains: params.search } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          systemRole: true,
          accountStatus: true,
          createdAt: true,
          updatedAt: true,
          ownedArtists: { select: { id: true, name: true }, take: 3 },
          memberships: {
            select: {
              role: true,
              organization: { select: { id: true, name: true } },
            },
            take: 3,
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, client: DatabaseClient = prisma) {
    return client.user.findUnique({
      where: { id },
      include: {
        ownedArtists: true,
        memberships: { include: { organization: true } },
        createdReleases: {
          orderBy: { updatedAt: "desc" },
          take: 20,
          select: { id: true, title: true, status: true, updatedAt: true },
        },
      },
    });
  }

  async updateRole(id: string, role: UserSystemRole, client: DatabaseClient) {
    return client.user.update({
      where: { id },
      data: { systemRole: role },
      select: { id: true, systemRole: true },
    });
  }

  async updateStatus(
    id: string,
    status: UserAccountStatus,
    client: DatabaseClient,
  ) {
    return client.user.update({
      where: { id },
      data: { accountStatus: status },
      select: { id: true, accountStatus: true },
    });
  }

  async countActiveSuperAdmins(client: DatabaseClient = prisma) {
    return client.user.count({
      where: { systemRole: "SUPER_ADMIN", accountStatus: "ACTIVE" },
    });
  }
}

export const adminUserRepository = new AdminUserRepository();
