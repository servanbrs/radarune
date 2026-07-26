import "server-only";
import { prisma } from "@/server/prisma/prisma";
import type { CreateOrganizationInput } from "@/features/organization/schemas/organization.schema";

export class OrganizationRepository {
  async findPrimaryMembershipByUserId(userId: string) {
    return prisma.organizationMembership.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      orderBy: [
        {
          role: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
      select: {
        id: true,
        role: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            tenantStatus: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                memberships: true,
              },
            },
          },
        },
      },
    });
  }

  async findOrganizationBySlug(slug: string) {
    return prisma.organization.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });
  }

  async createOrganizationForOwner(userId: string, input: CreateOrganizationInput) {
    return prisma.$transaction(async (tx) => {
      const now = new Date();
      const organization = await tx.organization.create({
        data: {
          name: input.name,
          slug: input.slug,
          ownerUserId: userId,
          tenantStatus: "ACTIVE",
          onboardingCompletedAt: now,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          tenantStatus: true,
          onboardingCompletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.organizationMembership.create({
        data: {
          organizationId: organization.id,
          role: "OWNER",
          tenantRole: "OWNER",
          status: "ACTIVE",
          joinedAt: now,
          userId,
        },
      });

      await tx.installationState.create({
        data: {
          organizationId: organization.id,
          status: "COMPLETED",
          currentStep: "COMPLETED",
          completedAt: now,
          lockedAt: now,
        },
      });

      return organization;
    });
  }

  async countMembershipsByOrganizationId(organizationId: string) {
    return prisma.organizationMembership.count({
      where: {
        organizationId,
      },
    });
  }
}

export const organizationRepository = new OrganizationRepository();
