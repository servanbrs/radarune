import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";

export class TenantRepository {
  async findById(organizationId: string) {
    return prisma.organization.findUnique({
      where: { id: organizationId },
      include: { tenantBranding: true, themeConfig: true, discoverConfig: true },
    });
  }

  async findByHost(host: string) {
    return prisma.organization.findFirst({
      where: {
        tenantStatus: { in: ["ACTIVE", "MAINTENANCE"] },
        OR: [
          { primaryDomain: host },
          { tenantDomains: { some: { domain: host, status: "ACTIVE" } } },
        ],
      },
      include: { tenantBranding: true, themeConfig: true, discoverConfig: true },
    });
  }

  async findByMembership(userId: string) {
    return prisma.organizationMembership.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: { organization: { include: { tenantBranding: true, themeConfig: true, discoverConfig: true } } },
    });
  }

  async findDomain(organizationId: string, domain: string) {
    return prisma.tenantDomain.findFirst({ where: { organizationId, domain } });
  }

  async createDomain(input: { organizationId: string; domain: string; verificationToken: string }) {
    return prisma.tenantDomain.create({ data: input });
  }

  async listDomains(organizationId: string) {
    return prisma.tenantDomain.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        domain: true,
        status: true,
        verificationMethod: true,
        sslStatus: true,
        verifiedAt: true,
        activatedAt: true,
        lastCheckedAt: true,
        lastError: true,
        createdAt: true,
      },
    });
  }

  async upsertBranding(organizationId: string, input: { brandName: string; legalName: string | null; logoUrl: string | null; faviconUrl: string | null; supportEmail: string | null; socialLinks: Prisma.InputJsonValue | typeof Prisma.JsonNull; seoDefaults: Prisma.InputJsonValue | typeof Prisma.JsonNull }) {
    return prisma.tenantBranding.upsert({
      where: { organizationId },
      update: input,
      create: { organizationId, ...input },
    });
  }
}

export const tenantRepository = new TenantRepository();
