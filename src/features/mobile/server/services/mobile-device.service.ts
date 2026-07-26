import "server-only";
import { prisma } from "@/server/prisma/prisma";
import type { MobileRegisterDeviceInput } from "@/features/mobile/contracts/mobile-api.contract";
import type { MobileRouteActor } from "@/features/mobile/server/http/mobile-route";
import { encryptMobileSecret } from "@/features/mobile/server/lib/mobile-crypto";
import { hashMobileSecret, maskToken } from "@/features/mobile/server/lib/mobile-security";

export class MobileDeviceService {
  async registerDevice(actor: MobileRouteActor, input: MobileRegisterDeviceInput) {
    const device = await prisma.mobileDevice.upsert({
      where: { userId_deviceId: { userId: actor.userId, deviceId: input.deviceId } },
      update: {
        platform: input.platform,
        deviceName: input.deviceName ?? null,
        appVersion: input.appVersion,
        osVersion: input.osVersion ?? null,
        locale: input.locale ?? null,
        timezone: input.timezone ?? null,
        active: true,
        lastSeenAt: new Date(),
      },
      create: {
        organizationId: actor.organizationId,
        userId: actor.userId,
        deviceId: input.deviceId,
        platform: input.platform,
        deviceName: input.deviceName ?? null,
        appVersion: input.appVersion,
        osVersion: input.osVersion ?? null,
        locale: input.locale ?? null,
        timezone: input.timezone ?? null,
      },
    });

    if (input.pushToken) {
      const tokenHash = hashMobileSecret(input.pushToken);
      await prisma.pushToken.updateMany({
        where: { tokenHash, userId: { not: actor.userId }, active: true },
        data: { active: false, invalidatedAt: new Date() },
      });
      await prisma.pushToken.upsert({
        where: { tokenHash },
        update: {
          organizationId: actor.organizationId,
          userId: actor.userId,
          deviceId: device.id,
          provider: input.provider,
          tokenEncrypted: encryptMobileSecret(input.pushToken),
          maskedToken: maskToken(input.pushToken),
          active: true,
          invalidatedAt: null,
        },
        create: {
          organizationId: actor.organizationId,
          userId: actor.userId,
          deviceId: device.id,
          provider: input.provider,
          tokenHash,
          tokenEncrypted: encryptMobileSecret(input.pushToken),
          maskedToken: maskToken(input.pushToken),
        },
      });
    }

    return { id: device.id, active: device.active };
  }

  async deleteDevice(actor: MobileRouteActor, id: string) {
    const result = await prisma.mobileDevice.updateMany({
      where: { id, userId: actor.userId },
      data: { active: false },
    });
    if (result.count === 0) {
      throw new Error("Cihaz bulunamadı.");
    }
    await prisma.pushToken.updateMany({
      where: { deviceId: id, userId: actor.userId },
      data: { active: false, invalidatedAt: new Date() },
    });
  }
}

export const mobileDeviceService = new MobileDeviceService();
