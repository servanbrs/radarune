import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { stableHash } from "@/features/intelligence/lib/hash";
import { intelligenceRepository } from "@/features/intelligence/server/repositories/intelligence.repository";

type ReleaseDetail = NonNullable<Awaited<ReturnType<typeof intelligenceRepository.findReleaseDetail>>>;

export class ArtworkAnalysisService {
  async analyze(release: ReleaseDetail) {
    const upload = release.uploads.find((item) => item.id === release.artworkUploadId && item.kind === "ARTWORK");
    if (!upload) {
      return null;
    }

    const issues: Prisma.ArtworkAnalysisIssueUncheckedCreateWithoutAnalysisInput[] = [];

    if (!["image/jpeg", "image/png"].includes(upload.mimeType)) {
      issues.push({
        code: "UNSUPPORTED_ARTWORK_FORMAT",
        severity: "ERROR",
        blocking: true,
        message: "Kapak görseli JPG veya PNG olmalıdır.",
      });
    }

    if (upload.width === null || upload.height === null) {
      issues.push({
        code: "ARTWORK_DIMENSIONS_NOT_AVAILABLE",
        severity: "WARNING",
        blocking: false,
        message: "Kapak boyutları doğrulanamadı.",
      });
    } else {
      if (upload.width < 3000 || upload.height < 3000) {
        issues.push({
          code: "ARTWORK_RESOLUTION_TOO_LOW",
          severity: "ERROR",
          blocking: true,
          message: "Kapak görseli en az 3000 x 3000 piksel olmalıdır.",
        });
      }
      if (upload.width !== upload.height) {
        issues.push({
          code: "ARTWORK_NOT_SQUARE",
          severity: "ERROR",
          blocking: true,
          message: "Kapak görseli kare olmalıdır.",
        });
      }
    }

    if (upload.byteSize > BigInt(20 * 1024 * 1024)) {
      issues.push({
        code: "ARTWORK_FILE_TOO_LARGE",
        severity: "ERROR",
        blocking: true,
        message: "Kapak görseli 20 MB sınırını aşamaz.",
      });
    }

    return intelligenceRepository.createArtworkAnalysis({
      organizationId: release.organizationId,
      releaseId: release.id,
      uploadId: upload.id,
      inputHash: stableHash({
        uploadId: upload.id,
        checksumSha256: upload.checksumSha256,
        width: upload.width,
        height: upload.height,
        mimeType: upload.mimeType,
        byteSize: upload.byteSize.toString(),
      }),
      status: "COMPLETED",
      width: upload.width,
      height: upload.height,
      aspectRatio: upload.width && upload.height ? new Prisma.Decimal(upload.width / upload.height) : null,
      fileSizeBytes: upload.byteSize,
      mimeType: upload.mimeType,
      riskSignal: "NO_OBVIOUS_RISK",
    }, issues);
  }
}

export const artworkAnalysisService = new ArtworkAnalysisService();
