import "server-only";
import { prisma } from "@/server/prisma/prisma";
import type { DatabaseClient } from "@/server/prisma/database-client";

export class NotificationService {
  async notifyStaff(input: {
    organizationId?: string;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
  }) {
    const staff = await prisma.user.findMany({
      where: {
        accountStatus: "ACTIVE",
        ...(input.organizationId
          ? {
              OR: [
                { systemRole: "MODERATOR" },
                { systemRole: "SUPER_ADMIN" },
                {
                  systemRole: "ADMIN",
                  memberships: { some: { organizationId: input.organizationId } },
                },
              ],
            }
          : { systemRole: { in: ["MODERATOR", "ADMIN", "SUPER_ADMIN"] } }),
      },
      select: { id: true, systemRole: true },
    });

    return Promise.all(
      staff.map((member) => {
        // Moderators are platform-wide reviewers, so their notification is
        // intentionally global even when the event belongs to one workspace.
        if (member.systemRole === "MODERATOR") {
          return this.create({
            type: input.type,
            title: input.title,
            message: input.message,
            userId: member.id,
            ...(input.entityType ? { entityType: input.entityType } : {}),
            ...(input.entityId ? { entityId: input.entityId } : {}),
          });
        }
        return this.create({ ...input, userId: member.id });
      }),
    );
  }

  async notifyOrganizationAdmins(input: {
    organizationId: string;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
  }) {
    return this.notifyStaff(input);
  }

  async create(
    input: {
      organizationId?: string;
      userId: string;
      type: string;
      title: string;
      message: string;
      entityType?: string;
      entityId?: string;
    },
    client: DatabaseClient = prisma,
  ) {
    return client.notification.create({
      data: {
        organizationId: input.organizationId ?? null,
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      },
      select: { id: true },
    });
  }
}

export const notificationService = new NotificationService();
