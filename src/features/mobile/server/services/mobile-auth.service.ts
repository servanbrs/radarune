import "server-only";
import { verifyPassword } from "better-auth/crypto";
import { headers } from "next/headers";
import { prisma } from "@/server/prisma/prisma";
import { organizationRepository } from "@/features/organization/server/repositories/organization.repository";
import { userAuthRepository } from "@/features/authentication/server/repositories/user-auth.repository";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import type { MobileDeviceInput, MobileLoginInput, MobileRefreshInput } from "@/features/mobile/contracts/mobile-api.contract";
import {
  addDays,
  addMinutes,
  createOpaqueToken,
  getMobileRequestFingerprint,
  hashMobileSecret,
} from "@/features/mobile/server/lib/mobile-security";

const accessTokenMinutes = 15;
const refreshTokenDays = 45;

type MobileActor = FinanceActorContext & {
  email: string;
  name: string;
  deviceSessionId: string;
  mobileDeviceId: string;
};

export class MobileAuthService {
  async login(input: MobileLoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: { accounts: true },
    });

    if (!user || user.accountStatus !== "ACTIVE") {
      throw new Error("E-posta veya parola hatalı.");
    }

    const credential = user.accounts.find((account) => account.providerId === "credential" && account.password);
    if (!credential?.password) {
      throw new Error("E-posta veya parola hatalı.");
    }

    const passwordValid = await verifyPassword({
      hash: credential.password,
      password: input.password,
    });

    if (!passwordValid) {
      throw new Error("E-posta veya parola hatalı.");
    }

    const membership = await organizationRepository.findPrimaryMembershipByUserId(user.id);
    if (!membership) {
      throw new Error("Aktif organizasyon bulunamadı.");
    }

    return this.createSession({
      userId: user.id,
      organizationId: membership.organization.id,
      device: input,
    });
  }

  async refresh(input: MobileRefreshInput) {
    const refreshTokenHash = hashMobileSecret(input.refreshToken);
    const existing = await prisma.deviceSession.findUnique({
      where: { refreshTokenHash },
      include: { tokenFamily: true, device: true, user: true },
    });

    if (!existing || existing.device.deviceId !== input.deviceId) {
      throw new Error("Refresh token geçersiz.");
    }

    if (existing.status !== "ACTIVE") {
      await prisma.refreshTokenFamily.update({
        where: { id: existing.tokenFamilyId },
        data: { status: "REUSE_DETECTED", reuseDetectedAt: new Date(), revokedAt: new Date() },
      });
      await prisma.deviceSession.updateMany({
        where: { tokenFamilyId: existing.tokenFamilyId },
        data: { status: "REUSE_DETECTED", revokedAt: new Date() },
      });
      throw new Error("Refresh token tekrar kullanımı algılandı.");
    }

    if (existing.tokenFamily.status !== "ACTIVE" || existing.refreshTokenExpiresAt <= new Date()) {
      throw new Error("Refresh token süresi dolmuş veya iptal edilmiş.");
    }

    await prisma.deviceSession.update({
      where: { id: existing.id },
      data: { status: "REVOKED", revokedAt: new Date() },
    });

    return this.rotateSession(existing.id, {
      userId: existing.userId,
      organizationId: existing.organizationId,
      deviceId: existing.deviceId,
      tokenFamilyId: existing.tokenFamilyId,
    });
  }

  async logout(refreshToken: string | null) {
    if (!refreshToken) {
      return;
    }

    const refreshTokenHash = hashMobileSecret(refreshToken);
    await prisma.deviceSession.updateMany({
      where: { refreshTokenHash },
      data: { status: "REVOKED", revokedAt: new Date() },
    });
  }

  async logoutAll(actor: FinanceActorContext) {
    await prisma.$transaction([
      prisma.deviceSession.updateMany({
        where: { userId: actor.userId, status: "ACTIVE" },
        data: { status: "REVOKED", revokedAt: new Date() },
      }),
      prisma.refreshTokenFamily.updateMany({
        where: { userId: actor.userId, status: "ACTIVE" },
        data: { status: "REVOKED", revokedAt: new Date() },
      }),
    ]);
  }

  async getActorFromRequest(): Promise<MobileActor | null> {
    const headerList = await headers();
    const authorization = headerList.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return null;
    }

    const tokenHash = hashMobileSecret(authorization.slice("Bearer ".length));
    const session = await prisma.deviceSession.findUnique({
      where: { accessTokenHash: tokenHash },
      include: { user: true, tokenFamily: true, device: true },
    });

    if (!session || session.status !== "ACTIVE" || session.tokenFamily.status !== "ACTIVE" || session.accessTokenExpiresAt <= new Date()) {
      return null;
    }

    const [membership, dashboardUser] = await Promise.all([
      organizationRepository.findPrimaryMembershipByUserId(session.userId),
      userAuthRepository.findDashboardUserById(session.userId),
    ]);

    if (!membership || !dashboardUser || dashboardUser.accountStatus !== "ACTIVE") {
      return null;
    }

    await prisma.deviceSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      organizationId: membership.organization.id,
      membershipRole: membership.role,
      systemRole: dashboardUser.systemRole,
      userId: dashboardUser.id,
      email: dashboardUser.email,
      name: dashboardUser.name,
      deviceSessionId: session.id,
      mobileDeviceId: session.deviceId,
    };
  }

  async me(actor: MobileActor) {
    const permissions = await prisma.organizationMembership.findFirst({
      where: { userId: actor.userId, organizationId: actor.organizationId },
      select: { role: true, organization: { select: { id: true, name: true, slug: true } } },
    });

    return {
      user: {
        id: actor.userId,
        name: actor.name,
        email: actor.email,
        systemRole: actor.systemRole,
      },
      organization: permissions?.organization ?? null,
      membershipRole: actor.membershipRole,
    };
  }

  private async createSession(input: {
    userId: string;
    organizationId: string;
    device: MobileDeviceInput;
  }) {
    const now = new Date();
    const accessToken = createOpaqueToken("rat");
    const refreshToken = createOpaqueToken("rrt");
    const familyToken = createOpaqueToken("rrt");
    const fingerprint = await getMobileRequestFingerprint();

    return prisma.$transaction(async (tx) => {
      const device = await tx.mobileDevice.upsert({
        where: { userId_deviceId: { userId: input.userId, deviceId: input.device.deviceId } },
        update: {
          organizationId: input.organizationId,
          platform: input.device.platform,
          deviceName: input.device.deviceName ?? null,
          appVersion: input.device.appVersion,
          osVersion: input.device.osVersion ?? null,
          locale: input.device.locale ?? null,
          timezone: input.device.timezone ?? null,
          active: true,
          lastSeenAt: now,
          lastIpHash: fingerprint.ipHash,
        },
        create: {
          organizationId: input.organizationId,
          userId: input.userId,
          deviceId: input.device.deviceId,
          platform: input.device.platform,
          deviceName: input.device.deviceName ?? null,
          appVersion: input.device.appVersion,
          osVersion: input.device.osVersion ?? null,
          locale: input.device.locale ?? null,
          timezone: input.device.timezone ?? null,
          lastIpHash: fingerprint.ipHash,
        },
      });

      const family = await tx.refreshTokenFamily.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          familyHash: hashMobileSecret(familyToken),
          expiresAt: addDays(now, refreshTokenDays),
        },
      });

      await tx.deviceSession.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          deviceId: device.id,
          tokenFamilyId: family.id,
          accessTokenHash: hashMobileSecret(accessToken),
          refreshTokenHash: hashMobileSecret(refreshToken),
          accessTokenExpiresAt: addMinutes(now, accessTokenMinutes),
          refreshTokenExpiresAt: addDays(now, refreshTokenDays),
          lastIpHash: fingerprint.ipHash,
          userAgentHash: fingerprint.userAgentHash,
        },
      });

      return {
        accessToken,
        refreshToken,
        tokenType: "Bearer" as const,
        expiresInSeconds: accessTokenMinutes * 60,
      };
    });
  }

  private async rotateSession(previousSessionId: string, input: {
    userId: string;
    organizationId: string;
    deviceId: string;
    tokenFamilyId: string;
  }) {
    const now = new Date();
    const accessToken = createOpaqueToken("rat");
    const refreshToken = createOpaqueToken("rrt");
    const fingerprint = await getMobileRequestFingerprint();

    await prisma.deviceSession.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        deviceId: input.deviceId,
        tokenFamilyId: input.tokenFamilyId,
        accessTokenHash: hashMobileSecret(accessToken),
        refreshTokenHash: hashMobileSecret(refreshToken),
        accessTokenExpiresAt: addMinutes(now, accessTokenMinutes),
        refreshTokenExpiresAt: addDays(now, refreshTokenDays),
        lastIpHash: fingerprint.ipHash,
        userAgentHash: fingerprint.userAgentHash,
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer" as const,
      expiresInSeconds: accessTokenMinutes * 60,
      rotatedFromSessionId: previousSessionId,
    };
  }
}

export const mobileAuthService = new MobileAuthService();
