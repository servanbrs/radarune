import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { intelligenceRepository } from "@/features/intelligence/server/repositories/intelligence.repository";

type ReleaseDetail = NonNullable<Awaited<ReturnType<typeof intelligenceRepository.findReleaseDetail>>>;
type ReleaseTrack = ReleaseDetail["tracks"][number];

export class AudioFingerprintService {
  async fingerprint(release: ReleaseDetail, track: ReleaseTrack) {
    const upload = track.uploads.find((item) => item.id === track.audioUploadId && item.kind === "AUDIO");
    if (!upload?.checksumSha256) {
      return null;
    }

    return intelligenceRepository.upsertAudioFingerprint({
      organizationId: release.organizationId,
      trackId: track.id,
      uploadId: upload.id,
      fileHash: upload.checksumSha256,
      normalizedHash: upload.checksumSha256,
      algorithm: "SHA256",
    });
  }
}

export const audioFingerprintService = new AudioFingerprintService();

export class DuplicateDetectionService {
  async detectExactMatches(release: ReleaseDetail, track: ReleaseTrack) {
    const fingerprint = await audioFingerprintService.fingerprint(release, track);
    if (!fingerprint) {
      return [];
    }

    const matches = await intelligenceRepository.findFingerprintsByFileHash(fingerprint.fileHash);
    const created = [];
    for (const match of matches) {
      if (match.id === fingerprint.id) {
        continue;
      }

      created.push(
        await intelligenceRepository.createDuplicateMatch({
          organizationId: release.organizationId,
          releaseId: release.id,
          trackId: track.id,
          sourceFingerprintId: fingerprint.id,
          matchedOrganizationId: match.organizationId,
          matchedFingerprintId: match.id,
          exactHashMatch: true,
          similarityScore: new Prisma.Decimal(1),
          status: match.organizationId === release.organizationId ? "POSSIBLE" : "MANUAL_REVIEW",
          crossTenant: match.organizationId !== release.organizationId,
        }),
      );
    }

    return created;
  }
}

export const duplicateDetectionService = new DuplicateDetectionService();
