import "server-only";
import { prisma } from "@/server/prisma/prisma";
import type { DatabaseClient } from "@/server/prisma/database-client";

export type CreateUploadRecordInput = {
  organizationId: string;
  ownerUserId: string;
  kind: "AUDIO" | "ARTWORK";
  fileName: string;
  mimeType: string;
  byteSize: bigint;
  storageKey: string;
  checksumSha256: string;
  width?: number;
  height?: number;
};

export class UploadRepository {
  async create(input: CreateUploadRecordInput, client: DatabaseClient = prisma) {
    return client.upload.create({
      data: {
        organizationId: input.organizationId,
        ownerUserId: input.ownerUserId,
        kind: input.kind,
        status: "PENDING",
        fileName: input.fileName,
        mimeType: input.mimeType,
        byteSize: input.byteSize,
        storageKey: input.storageKey,
        checksumSha256: input.checksumSha256,
        width: input.width ?? null,
        height: input.height ?? null,
      },
      select: {
        id: true,
        kind: true,
        status: true,
        fileName: true,
        mimeType: true,
        byteSize: true,
        width: true,
        height: true,
      },
    });
  }
}

export const uploadRepository = new UploadRepository();
