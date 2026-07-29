import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/server/prisma/prisma";
import type { CreateOrganizationInput } from "@/features/organization/schemas/organization.schema";

const PERSONAL_WORKSPACE_SLUG_PREFIX = "personal-";

const organizationContextSelect = {
  id: true,
  role: true,
  organization: {
    select: {
      id: true,
      name: true,
      slug: true,
      defaultLocale: true,
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
} as const;

function createPersonalWorkspaceSlug(userId: string) {
  const normalizedUserId = userId
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 24);

  const userHash = createHash("sha256")
    .update(userId)
    .digest("hex")
    .slice(0, 16);

  return `${PERSONAL_WORKSPACE_SLUG_PREFIX}${normalizedUserId || "user"}-${userHash}`.slice(
    0,
    60,
  );
}

function createPersonalWorkspaceName(userName: string) {
  const normalizedName = userName.trim().slice(0, 90);

  return normalizedName
    ? `${normalizedName} kişisel alanı`
    : "Radarune kişisel alanı";
}

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
      select: organizationContextSelect,
    });
  }

  private async findPersonalOrganizationByOwnerUserId(userId: string) {
    return prisma.organization.findFirst({
      where: {
        ownerUserId: userId,
        slug: {
          startsWith: PERSONAL_WORKSPACE_SLUG_PREFIX,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        slug: true,
      },
    });
  }

  async ensurePersonalOrganizationForUser(
    userId: string,
    userName: string,
  ) {
    const existingMembership =
      await this.findPrimaryMembershipByUserId(userId);

    if (existingMembership) {
      return existingMembership;
    }

    const now = new Date();
    const name = createPersonalWorkspaceName(userName);

    let organization =
      await this.findPersonalOrganizationByOwnerUserId(userId);

    if (!organization) {
      const slug = createPersonalWorkspaceSlug(userId);

      // Dashboard layout ve sayfa aynı anda çalışabildiği için iki istek
      // eş zamanlı olarak kişisel alan oluşturmaya çalışabilir. createMany +
      // skipDuplicates bu yarışı güvenli ve tekrarlanabilir hâle getirir.
      await prisma.organization.createMany({
        data: [
          {
            name,
            slug,
            ownerUserId: userId,
            tenantStatus: "ACTIVE",
            tenantMode: "SINGLE_TENANT",
            tenantPlan: "COMMUNITY",
            onboardingCompletedAt: now,
          },
        ],
        skipDuplicates: true,
      });

      const createdOrExistingOrganization =
        await prisma.organization.findUnique({
          where: {
            slug,
          },
          select: {
            id: true,
            slug: true,
            ownerUserId: true,
          },
        });

      if (
        !createdOrExistingOrganization ||
        createdOrExistingOrganization.ownerUserId !== userId
      ) {
        throw new Error(
          "Kişisel çalışma alanı güvenli biçimde oluşturulamadı.",
        );
      }

      organization = {
        id: createdOrExistingOrganization.id,
        slug: createdOrExistingOrganization.slug,
      };
    }

    const organizationId = organization.id;

    return prisma.$transaction(async (tx) => {
      await tx.organization.updateMany({
        where: {
          id: organizationId,
          ownerUserId: userId,
        },
        data: {
          name,
          tenantStatus: "ACTIVE",
          tenantMode: "SINGLE_TENANT",
          tenantPlan: "COMMUNITY",
          onboardingCompletedAt: now,
        },
      });

      await tx.organizationMembership.createMany({
        data: [
          {
            organizationId,
            userId,
            role: "OWNER",
            tenantRole: "OWNER",
            status: "ACTIVE",
            joinedAt: now,
          },
        ],
        skipDuplicates: true,
      });

      await tx.organizationMembership.update({
        where: {
          organizationId_userId: {
            organizationId,
            userId,
          },
        },
        data: {
          role: "OWNER",
          tenantRole: "OWNER",
          status: "ACTIVE",
          joinedAt: now,
        },
      });

      await tx.installationState.createMany({
        data: [
          {
            organizationId,
            status: "COMPLETED",
            currentStep: "COMPLETED",
            completedAt: now,
            lockedAt: now,
          },
        ],
        skipDuplicates: true,
      });

      await tx.installationState.update({
        where: {
          organizationId,
        },
        data: {
          status: "COMPLETED",
          currentStep: "COMPLETED",
          completedAt: now,
          lockedAt: now,
        },
      });

      return tx.organizationMembership.findUniqueOrThrow({
        where: {
          organizationId_userId: {
            organizationId,
            userId,
          },
        },
        select: organizationContextSelect,
      });
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
