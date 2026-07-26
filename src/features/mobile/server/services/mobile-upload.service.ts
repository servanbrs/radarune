import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/server/prisma/prisma";
import { acceptedArtworkMimeTypes, acceptedAudioMimeTypes, maxArtworkFileBytes, maxAudioFileBytes } from "@/features/releases/constants/release.constants";
import type { MobileUploadInitInput } from "@/features/mobile/contracts/mobile-api.contract";
import type { MobileRouteActor } from "@/features/mobile/server/http/mobile-route";
import { addMinutes } from "@/features/mobile/server/lib/mobile-security";

export class MobileUploadService {
  async init(actor: MobileRouteActor, input: MobileUploadInitInput) {
    this.assertFile(input);
    const storageKey = [
      actor.organizationId,
      "mobile",
      input.kind.toLowerCase(),
      `${randomUUID()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120)}`,
    ].join("/");

    return prisma.mobileUploadSession.upsert({
      where: { idempotencyKey: input.idempotencyKey },
      update: {},
      create: {
        organizationId: actor.organizationId,
        userId: actor.userId,
        idempotencyKey: input.idempotencyKey,
        kind: input.kind,
        fileName: input.fileName,
        mimeType: input.mimeType,
        byteSize: BigInt(input.byteSize),
        checksumSha256: input.checksumSha256 ?? null,
        storageKey,
        signedUploadUrl: null,
        expiresAt: addMinutes(new Date(), 30),
      },
      select: {
        id: true,
        status: true,
        storageKey: true,
        signedUploadUrl: true,
        expiresAt: true,
      },
    });
  }

  async complete(actor: MobileRouteActor, uploadSessionId: string) {
    const session = await prisma.mobileUploadSession.findFirst({
      where: { id: uploadSessionId, userId: actor.userId, organizationId: actor.organizationId },
    });

    if (!session) {
      throw new Error("Upload session bulunamadı.");
    }
    if (session.expiresAt <= new Date()) {
      await prisma.mobileUploadSession.update({
        where: { id: session.id },
        data: { status: "EXPIRED", failureReason: "Upload session süresi doldu." },
      });
      throw new Error("Upload session süresi doldu.");
    }
    if (!["CREATED", "UPLOADING", "VERIFYING"].includes(session.status)) {
      throw new Error("Upload session durumu çakışıyor.");
    }

    return prisma.$transaction(async (tx) => {
      const upload = await tx.upload.create({
        data: {
          organizationId: actor.organizationId,
          ownerUserId: actor.userId,
          kind: session.kind,
          status: "READY",
          fileName: session.fileName,
          mimeType: session.mimeType,
          byteSize: session.byteSize,
          storageKey: session.storageKey,
          checksumSha256: session.checksumSha256,
        },
        select: { id: true, kind: true, status: true, storageKey: true },
      });

      await tx.mobileUploadSession.update({
        where: { id: session.id },
        data: { status: "COMPLETED", uploadId: upload.id, completedAt: new Date() },
      });

      return upload;
    });
  }

  async abort(actor: MobileRouteActor, uploadSessionId: string) {
    const result = await prisma.mobileUploadSession.updateMany({
      where: { id: uploadSessionId, userId: actor.userId, organizationId: actor.organizationId, status: { in: ["CREATED", "UPLOADING", "PAUSED"] } },
      data: { status: "ABORTED", abortedAt: new Date() },
    });
    if (result.count === 0) {
      throw new Error("Upload session bulunamadı veya iptal edilemez.");
    }
  }

  async get(actor: MobileRouteActor, uploadSessionId: string) {
    const session = await prisma.mobileUploadSession.findFirst({
      where: { id: uploadSessionId, userId: actor.userId, organizationId: actor.organizationId },
      select: { id: true, kind: true, status: true, fileName: true, byteSize: true, expiresAt: true, uploadId: true, failureReason: true },
    });
    if (!session) {
      throw new Error("Upload session bulunamadı.");
    }
    return session;
  }

  private assertFile(input: MobileUploadInitInput) {
    if (input.kind === "AUDIO") {
      if (!acceptedAudioMimeTypes.includes(input.mimeType as (typeof acceptedAudioMimeTypes)[number])) {
        throw new Error("Ses dosyası WAV veya FLAC formatında olmalıdır.");
      }
      if (input.byteSize > maxAudioFileBytes) {
        throw new Error("Ses dosyası izin verilen maksimum boyutu aşıyor.");
      }
      return;
    }

    if (!acceptedArtworkMimeTypes.includes(input.mimeType as (typeof acceptedArtworkMimeTypes)[number])) {
      throw new Error("Kapak görseli JPG veya PNG formatında olmalıdır.");
    }
    if (input.byteSize > maxArtworkFileBytes) {
      throw new Error("Kapak görseli en fazla 20 MB olabilir.");
    }
  }
}

export const mobileUploadService = new MobileUploadService();
