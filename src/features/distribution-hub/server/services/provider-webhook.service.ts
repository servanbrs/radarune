import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { distributionProviderRegistry } from "@/features/distribution-hub/server/provider-registry";
import { providerWebhookEventRepository } from "@/features/distribution-hub/server/repositories/provider-webhook-event.repository";
import { releaseDeliveryRepository } from "@/features/distribution-hub/server/repositories/release-delivery.repository";
import { distributionStatusHistoryRepository } from "@/features/distribution-hub/server/repositories/distribution-status-history.repository";
import { distributionProviderConfigurationService } from "@/features/distribution-hub/server/services/provider-configuration.service";
import { releaseRepository } from "@/features/releases/server/repositories/release.repository";
import { prisma } from "@/server/prisma/prisma";

export class ProviderWebhookService {
  async handleWebhook(
    provider: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL",
    body: string,
    headers: Record<string, string>,
  ) {
    const adapter = distributionProviderRegistry.getAdapter(provider);
    const runtimeConfiguration =
      (await distributionProviderConfigurationService.getRuntimeConfiguration(
        "",
        provider,
      )) ?? null;

    const signature = headers["x-signature"] ?? headers["stripe-signature"];
    const normalized = await adapter.normalizeWebhook(
      {
        payload: body,
        ...(signature ? { signature } : {}),
      },
      runtimeConfiguration
        ? {
            environment: runtimeConfiguration.environment,
            credentials: runtimeConfiguration.credentials,
            publicMetadata: runtimeConfiguration.publicMetadata,
            ...(runtimeConfiguration.webhookSecret
              ? { webhookSecret: runtimeConfiguration.webhookSecret }
              : {}),
          }
        : null,
    );

    if (!normalized.success) {
      const event = await providerWebhookEventRepository.create({
        provider,
        externalEventId: `invalid:${Date.now()}`,
        processingStatus:
          normalized.code === "WEBHOOK_VERIFICATION_FAILED"
            ? "INVALID_SIGNATURE"
            : "FAILED",
        signatureVerified: false,
        payload: JSON.parse(body) as Prisma.InputJsonValue,
        headers: headers as unknown as Prisma.InputJsonValue,
        errorMessage: normalized.message,
      });

      return {
        success: false as const,
        statusCode: normalized.code === "WEBHOOK_VERIFICATION_FAILED" ? 401 : 400,
        data: event,
      };
    }

    const duplicate = await providerWebhookEventRepository.findDuplicate(
      provider,
      normalized.data.eventId,
    );

    if (duplicate) {
      return {
        success: true as const,
        statusCode: 200,
        data: {
          duplicate: true,
        },
      };
    }

    const delivery = normalized.data.externalReleaseId
      ? await releaseDeliveryRepository.findByExternalReleaseId(
          provider,
          normalized.data.externalReleaseId,
        )
      : null;

    const event = await prisma.$transaction(async (tx) => {
      const created = await providerWebhookEventRepository.create(
        {
          ...(delivery?.organizationId ? { organizationId: delivery.organizationId } : {}),
          ...(delivery?.providerConfigurationId
            ? { providerConfigurationId: delivery.providerConfigurationId }
            : {}),
          ...(delivery?.id ? { releaseDeliveryId: delivery.id } : {}),
          provider,
          externalEventId: normalized.data.eventId,
          processingStatus: "PENDING",
          signatureVerified: true,
          payload: JSON.parse(body) as Prisma.InputJsonValue,
          headers: headers as unknown as Prisma.InputJsonValue,
          normalizedPayload: normalized.data as unknown as Prisma.InputJsonValue,
        },
        tx,
      );

      if (delivery && normalized.data.deliveryStatus) {
        await releaseDeliveryRepository.updateStatus(
          delivery.id,
          {
            status: normalized.data.deliveryStatus,
            lastSyncedAt: new Date(),
            ...(normalized.data.deliveryStatus === "LIVE" ? { liveAt: new Date() } : {}),
            ...(normalized.data.deliveryStatus === "REJECTED"
              ? {
                  rejectedAt: new Date(),
                  failureReason: normalized.data.errorMessage ?? "Provider rejection",
                }
              : {}),
          },
          tx,
        );

        await distributionStatusHistoryRepository.create(
          {
            organizationId: delivery.organizationId,
            releaseDeliveryId: delivery.id,
            status: normalized.data.deliveryStatus,
            ...(normalized.data.errorMessage
              ? { message: normalized.data.errorMessage }
              : {}),
          },
          tx,
        );

        if (normalized.data.deliveryStatus === "LIVE") {
          await releaseRepository.updateStatus(
            delivery.releaseId,
            {
              status: "LIVE",
              previousStatus: "DISTRIBUTED",
              reason: "Provider webhook yayının canlı olduğunu bildirdi.",
              metadata: {
                provider,
                webhookEventId: normalized.data.eventId,
              },
            },
            tx,
          );
        }

        if (normalized.data.deliveryStatus === "DELIVERED") {
          await releaseRepository.updateStatus(
            delivery.releaseId,
            {
              status: "DISTRIBUTED",
              previousStatus: "PROCESSING",
              reason: "Provider webhook yayının teslim edildiğini bildirdi.",
              metadata: {
                provider,
                webhookEventId: normalized.data.eventId,
              },
            },
            tx,
          );
        }
      }

      await providerWebhookEventRepository.updateStatus(
        created.id,
        {
          processingStatus: "PROCESSED",
          signatureVerified: true,
          processedAt: new Date(),
          ...(delivery?.id ? { releaseDeliveryId: delivery.id } : {}),
        },
        tx,
      );

      return created;
    });

    return {
      success: true as const,
      statusCode: 200,
      data: event,
    };
  }
}

export const providerWebhookService = new ProviderWebhookService();
