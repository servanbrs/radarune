import "server-only";
import { prisma } from "@/server/prisma/prisma";
import { decryptMobileSecret } from "@/features/mobile/server/lib/mobile-crypto";

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

type ExpoPushResult = {
  data?: Array<{ status: "ok" | "error"; id?: string; message?: string; details?: { error?: string } }>;
  errors?: Array<{ message: string }>;
};

export class PushNotificationService {
  async enqueueForNotification(notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: { user: true },
    });
    if (!notification) {
      throw new Error("Bildirim bulunamadı.");
    }

    const tokens = await prisma.pushToken.findMany({
      where: { userId: notification.userId, active: true },
    });

    if (tokens.length === 0) {
      return { queued: 0 };
    }

    const push = await prisma.pushNotification.create({
      data: {
        organizationId: notification.organizationId,
        userId: notification.userId,
        notificationId: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.message,
        deepLink: this.deepLinkFor(notification.entityType, notification.entityId),
        deliveries: {
          create: tokens.map((token) => ({
            organizationId: notification.organizationId ?? token.organizationId,
            pushTokenId: token.id,
            provider: token.provider,
            status: "QUEUED",
            queuedAt: new Date(),
          })),
        },
      },
      include: { deliveries: true },
    });

    return { pushNotificationId: push.id, queued: push.deliveries.length };
  }

  async processNext() {
    const delivery = await prisma.pushNotificationDelivery.findFirst({
      where: { status: { in: ["PENDING", "QUEUED"] } },
      orderBy: { createdAt: "asc" },
      include: { pushNotification: true, pushToken: true },
    });

    if (!delivery) {
      return null;
    }

    if (delivery.pushToken.provider !== "EXPO_PUSH") {
      await this.failDelivery(delivery.id, "PROVIDER_NOT_CONFIGURED", "Bu push provider için adapter yapılandırılmadı.");
      return { deliveryId: delivery.id, status: "FAILED" as const };
    }

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: decryptMobileSecret(delivery.pushToken.tokenEncrypted),
        title: delivery.pushNotification.title,
        body: delivery.pushNotification.body,
        data: { deepLink: delivery.pushNotification.deepLink },
      } satisfies Partial<ExpoPushMessage>),
    });

    const body = (await response.json().catch(() => ({}))) as ExpoPushResult;
    const result = body.data?.[0];
    if (!response.ok || result?.status === "error") {
      const code = result?.details?.error ?? "EXPO_PUSH_ERROR";
      const message = result?.message ?? body.errors?.[0]?.message ?? "Expo push gönderimi başarısız oldu.";
      await this.failDelivery(delivery.id, code, message);
      if (code === "DeviceNotRegistered") {
        await prisma.pushToken.update({
          where: { id: delivery.pushTokenId },
          data: { active: false, invalidatedAt: new Date() },
        });
      }
      return { deliveryId: delivery.id, status: "FAILED" as const };
    }

    await prisma.pushNotificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "SENT",
        providerMessageId: result?.id ?? null,
        sentAt: new Date(),
      },
    });

    return { deliveryId: delivery.id, status: "SENT" as const };
  }

  private async failDelivery(id: string, code: string, message: string) {
    await prisma.pushNotificationDelivery.update({
      where: { id },
      data: {
        status: code === "DeviceNotRegistered" ? "INVALID_TOKEN" : "FAILED",
        errorCode: code,
        errorMessage: message,
        failedAt: new Date(),
      },
    });
  }

  private deepLinkFor(entityType: string | null, entityId: string | null) {
    if (!entityType || !entityId) {
      return "radarune://notifications";
    }
    return `radarune://${entityType.toLowerCase()}/${encodeURIComponent(entityId)}`;
  }
}

export const pushNotificationService = new PushNotificationService();
